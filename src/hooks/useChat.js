import { useCallback, useEffect, useRef, useState } from 'react';
import { streamChatCompletion } from '../services/geminiService';
import { useExportWizard } from './useExportWizard';
import { QUICK_ACTION_PROMPTS, estimateToPlainText } from '../utils/exportCalculator';

const STORAGE_KEY = 'gemini-chatbot-state';

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createEmptyChat() {
  const id = generateId();
  return {
    id,
    title: 'New chat',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.chats?.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

function deriveTitle(messages) {
  const firstUser = messages.find((m) => m.role === 'user' && m.type !== 'estimate');
  if (!firstUser?.content) {
    const estimate = messages.find((m) => m.type === 'estimate');
    if (estimate?.estimateData?.product) {
      return `Estimate: ${estimate.estimateData.product}`;
    }
    return 'New chat';
  }
  const text = firstUser.content.trim();
  return text.length > 42 ? `${text.slice(0, 42)}…` : text;
}

export function useChat() {
  const saved = loadState();
  const initialChat = saved?.chats?.[0] ?? createEmptyChat();

  const [chats, setChats] = useState(saved?.chats ?? [initialChat]);
  const [activeChatId, setActiveChatId] = useState(saved?.activeChatId ?? initialChat.id);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quoteModal, setQuoteModal] = useState({ open: false, product: '' });

  const abortRef = useRef(null);
  const messagesEndRef = useRef(null);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? chats[0];
  const messages = activeChat?.messages ?? [];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ chats, activeChatId }));
  }, [chats, activeChatId]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const updateActiveChat = useCallback((updater) => {
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== activeChatId) return chat;
        const updated = typeof updater === 'function' ? updater(chat) : updater;
        return { ...updated, updatedAt: Date.now() };
      })
    );
  }, [activeChatId]);

  const appendToChat = useCallback(
    (newMessages) => {
      updateActiveChat((chat) => {
        const combined = [...chat.messages, ...newMessages];
        return {
          ...chat,
          messages: combined,
          title: chat.messages.length === 0 ? deriveTitle(combined) : chat.title,
        };
      });
      scrollToBottom();
    },
    [updateActiveChat, scrollToBottom]
  );

  const appendAssistantMessage = useCallback(
    (content, _options = {}) => {
      appendToChat([
        {
          id: generateId(),
          role: 'assistant',
          type: 'text',
          content,
          timestamp: Date.now(),
        },
      ]);
    },
    [appendToChat]
  );

  const appendEstimateMessage = useCallback(
    (estimateData) => {
      appendToChat([
        {
          id: generateId(),
          role: 'assistant',
          type: 'estimate',
          content: estimateToPlainText(estimateData),
          estimateData,
          timestamp: Date.now(),
        },
      ]);
      updateActiveChat((chat) => ({
        ...chat,
        title: `Estimate: ${estimateData.product}`,
      }));
    },
    [appendToChat, updateActiveChat]
  );

  const { wizardActive, startWizard, processWizardAnswer } = useExportWizard({
    appendAssistantMessage,
    appendEstimateMessage,
    isLoading,
  });

  const stopGenerating = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
  }, []);

  const sendToGemini = useCallback(
    async (historyMessages, assistantMessageId) => {
      setIsLoading(true);
      setError(null);
      abortRef.current = new AbortController();

      await streamChatCompletion(historyMessages, {
        signal: abortRef.current.signal,
        onChunk: (fullText) => {
          updateActiveChat((chat) => ({
            ...chat,
            messages: chat.messages.map((m) =>
              m.id === assistantMessageId ? { ...m, content: fullText } : m
            ),
          }));
        },
        onDone: (fullText) => {
          updateActiveChat((chat) => {
            const nextMessages = chat.messages.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content: fullText || m.content || ' ' }
                : m
            );
            return {
              ...chat,
              title: deriveTitle(nextMessages),
              messages: nextMessages,
            };
          });
          setIsLoading(false);
          abortRef.current = null;
        },
        onError: (message) => {
          setError(message);
          updateActiveChat((chat) => ({
            ...chat,
            messages: chat.messages.filter((m) => m.id !== assistantMessageId),
          }));
          setIsLoading(false);
          abortRef.current = null;
        },
      });
    },
    [updateActiveChat]
  );

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMessage = {
        id: generateId(),
        role: 'user',
        type: 'text',
        content: trimmed,
        timestamp: Date.now(),
      };

      appendToChat([userMessage]);

      if (processWizardAnswer(trimmed)) {
        return;
      }

      const history = [...messages, userMessage];

      const assistantMessage = {
        id: generateId(),
        role: 'assistant',
        type: 'text',
        content: '',
        timestamp: Date.now(),
      };

      updateActiveChat((chat) => ({
        ...chat,
        messages: [...chat.messages, assistantMessage],
      }));

      await sendToGemini(history, assistantMessage.id);
    },
    [isLoading, messages, processWizardAnswer, appendToChat, sendToGemini, updateActiveChat]
  );

  const handleQuickAction = useCallback(
    (actionId) => {
      if (isLoading) return;

      if (actionId === 'import-cost') {
        startWizard();
        return;
      }

      const prompt = QUICK_ACTION_PROMPTS[actionId];
      if (prompt) {
        sendMessage(prompt);
      }
    },
    [isLoading, startWizard, sendMessage]
  );

  const regenerateResponse = useCallback(async () => {
    if (isLoading || messages.length < 2) return;

    const last = messages[messages.length - 1];
    if (last.role !== 'assistant' || last.type === 'estimate') return;

    const history = messages.slice(0, -1);
    const assistantMessage = {
      id: generateId(),
      role: 'assistant',
      type: 'text',
      content: '',
      timestamp: Date.now(),
    };

    updateActiveChat((chat) => ({
      ...chat,
      messages: [...history, assistantMessage],
    }));

    await sendToGemini(history, assistantMessage.id);
  }, [isLoading, messages, sendToGemini, updateActiveChat]);

  const openQuoteModal = useCallback((product) => {
    setQuoteModal({ open: true, product: product || '' });
  }, []);

  const closeQuoteModal = useCallback(() => {
    setQuoteModal({ open: false, product: '' });
  }, []);

  const submitQuoteRequest = useCallback(
    (data) => {
      const summary = [
        '**Official quotation request received** (saved in chat)',
        `- Name: ${data.name}`,
        data.company ? `- Company: ${data.company}` : null,
        `- Email: ${data.email}`,
        data.phone ? `- Phone: ${data.phone}` : null,
        `- Product: ${data.product || quoteModal.product}`,
        '',
        data.message,
      ]
        .filter(Boolean)
        .join('\n');

      appendAssistantMessage(
        `${summary}\n\n_Our export team will contact you within 1–2 business days. This is a demo submission — connect your CRM or email API for production._`,
        { skipGemini: true }
      );
    },
    [appendAssistantMessage, quoteModal.product]
  );

  const newChat = useCallback(() => {
    stopGenerating();
    setError(null);
    const chat = createEmptyChat();
    setChats((prev) => [chat, ...prev]);
    setActiveChatId(chat.id);
  }, [stopGenerating]);

  const clearChat = useCallback(() => {
    stopGenerating();
    setError(null);
    updateActiveChat((chat) => ({
      ...chat,
      title: 'New chat',
      messages: [],
    }));
  }, [stopGenerating, updateActiveChat]);

  const exportAsTxt = useCallback(() => {
    const lines = messages.map((m) => {
      const role = m.role === 'user' ? 'You' : 'Assistant';
      const time = new Date(m.timestamp).toLocaleString();
      const body =
        m.type === 'estimate' && m.estimateData
          ? estimateToPlainText(m.estimateData)
          : m.content;
      return `[${time}] ${role}:\n${body}\n`;
    });
    return lines.join('\n---\n\n');
  }, [messages]);

  const exportAsJson = useCallback(() => {
    return JSON.stringify(
      {
        id: activeChat.id,
        title: activeChat.title,
        exportedAt: new Date().toISOString(),
        messages,
      },
      null,
      2
    );
  }, [activeChat, messages]);

  const downloadFile = useCallback((content, filename, mime) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleExportTxt = useCallback(() => {
    if (!messages.length) return;
    const safeTitle = (activeChat.title || 'chat').replace(/[^\w\-]+/g, '_');
    downloadFile(exportAsTxt(), `${safeTitle}.txt`, 'text/plain');
  }, [activeChat.title, downloadFile, exportAsTxt, messages.length]);

  const handleExportJson = useCallback(() => {
    if (!messages.length) return;
    const safeTitle = (activeChat.title || 'chat').replace(/[^\w\-]+/g, '_');
    downloadFile(exportAsJson(), `${safeTitle}.json`, 'application/json');
  }, [activeChat.title, downloadFile, exportAsJson, messages.length]);

  const selectChat = useCallback(
    (chatId) => {
      if (chatId === activeChatId) return;
      stopGenerating();
      setError(null);
      setActiveChatId(chatId);
    },
    [activeChatId, stopGenerating]
  );

  const deleteChat = useCallback(
    (chatId) => {
      setChats((prev) => {
        const filtered = prev.filter((c) => c.id !== chatId);
        if (filtered.length === 0) {
          const fresh = createEmptyChat();
          setActiveChatId(fresh.id);
          return [fresh];
        }
        if (chatId === activeChatId) {
          setActiveChatId(filtered[0].id);
        }
        return filtered;
      });
    },
    [activeChatId]
  );

  return {
    chats,
    activeChatId,
    activeChat,
    messages,
    isLoading,
    error,
    setError,
    messagesEndRef,
    sendMessage,
    handleQuickAction,
    wizardActive,
    regenerateResponse,
    stopGenerating,
    newChat,
    clearChat,
    handleExportTxt,
    handleExportJson,
    selectChat,
    deleteChat,
    quoteModal,
    openQuoteModal,
    closeQuoteModal,
    submitQuoteRequest,
  };
}

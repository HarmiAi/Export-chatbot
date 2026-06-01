import axios from 'axios';

const MODEL = 'gemini-2.5-flash';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export const EXPORT_ASSISTANT_INSTRUCTION = `You are an Export Cost Calculator Assistant for an agricultural and spice export company.

Your role:
- Help buyers estimate import costs, shipping times, MOQ, packaging, and export destinations.
- Answer professionally about exports to UAE, USA, Canada, Germany, UK, and other countries.
- When asked "What is MOQ?", explain Minimum Order Quantity clearly (typical MOQ for spices is often 1–5 metric tons depending on product, packaging, and destination — always note this varies).
- When asked if you export to a country (e.g. UAE), confirm professionally that exports are available subject to documentation, compliance, and official quotation.
- Never claim exact or guaranteed prices. Always state figures are estimates unless the user completed the in-app import calculator card.
- Be concise, friendly, and trade-focused. Use markdown when helpful.
- If the user wants a formal quote, suggest they use "Request Official Quotation" on their estimate card or provide their contact details.`;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000,
});

function getApiKey() {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key || key.trim() === '') {
    throw new Error(
      'API key is missing. Add VITE_GEMINI_API_KEY to your .env file and restart the dev server.'
    );
  }
  return key.trim();
}

function messageToGeminiText(message) {
  if (message.type === 'estimate' && message.estimateData) {
    return `[Import cost estimate card shown to user for ${message.estimateData.product}]`;
  }
  return message.content || '';
}

/**
 * Convert app messages to Gemini contents format.
 */
export function formatMessagesForGemini(messages) {
  return messages
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && m.type !== 'estimate')
    .filter((m) => messageToGeminiText(m).trim())
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: messageToGeminiText(m) }],
    }));
}

function parseFriendlyError(error) {
  if (error?.message && !error?.response && !error?.status) {
    return error.message;
  }

  const status = error?.response?.status ?? error?.status;
  const data = error?.response?.data ?? error?.data;

  if (status === 400) {
    return data?.error?.message || 'Invalid request. Please check your message and try again.';
  }
  if (status === 401 || status === 403) {
    return 'Invalid API key. Please verify VITE_GEMINI_API_KEY in your .env file.';
  }
  if (status === 429) {
    return 'Rate limit exceeded. Please wait a moment and try again.';
  }
  if (status >= 500) {
    return 'Gemini service is temporarily unavailable. Please try again later.';
  }

  return data?.error?.message || error?.message || 'Something went wrong. Please try again.';
}

/**
 * Stream a chat completion from Gemini (SSE).
 */
export async function streamChatCompletion(messages, { onChunk, onDone, onError, signal }) {
  let apiKey;
  try {
    apiKey = getApiKey();
  } catch (err) {
    onError?.(err.message);
    return;
  }

  const contents = formatMessagesForGemini(messages);
  const url = `${BASE_URL}/models/${MODEL}:streamGenerateContent?key=${encodeURIComponent(apiKey)}&alt=sse`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: EXPORT_ASSISTANT_INSTRUCTION }],
        },
      }),
      signal,
    });

    if (!response.ok) {
      let errorBody = {};
      try {
        errorBody = await response.json();
      } catch {
        /* ignore */
      }
      throw { response: { status: response.status, data: errorBody } };
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Streaming is not supported in this environment.');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;

        const payload = trimmed.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;

        try {
          const parsed = JSON.parse(payload);
          const chunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (chunk) {
            fullText += chunk;
            onChunk?.(fullText);
          }
        } catch {
          /* skip malformed SSE chunks */
        }
      }
    }

    onDone?.(fullText);
  } catch (err) {
    if (err?.name === 'AbortError') {
      onDone?.('');
      return;
    }
    onError?.(parseFriendlyError(err));
  }
}

/**
 * Non-streaming completion via axios.
 */
export async function generateChatCompletion(messages, signal) {
  const apiKey = getApiKey();
  const contents = formatMessagesForGemini(messages);

  try {
    const { data } = await api.post(
      `/models/${MODEL}:generateContent`,
      {
        contents,
        systemInstruction: {
          parts: [{ text: EXPORT_ASSISTANT_INSTRUCTION }],
        },
      },
      {
        params: { key: apiKey },
        signal,
      }
    );

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!text) {
      throw new Error('No response received from Gemini.');
    }
    return text;
  } catch (err) {
    if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
      throw err;
    }
    throw new Error(parseFriendlyError(err));
  }
}

export { MODEL };

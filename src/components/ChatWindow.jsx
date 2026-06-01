import Message from './Message';
import TypingIndicator from './TypingIndicator';

function ChatWindow({
  messages,
  isLoading,
  error,
  onDismissError,
  messagesEndRef,
  onRegenerate,
  onRequestQuote,
  onQuickSuggestion,
}) {
  const lastMessage = messages[messages.length - 1];
  const showTyping =
    isLoading &&
    (!lastMessage ||
      lastMessage.role !== 'assistant' ||
      lastMessage.type === 'estimate' ||
      !lastMessage.content?.trim());

  return (
    <section className="chat-window" aria-label="Chat messages">
      <div className="chat-window__scroll">
        {messages.length === 0 && !error && (
          <div className="chat-window__empty">
            <div className="chat-window__empty-icon" aria-hidden="true">
              📦
            </div>
            <h2>Export Cost Calculator Assistant</h2>
            <p>
              Estimate import costs, check MOQ, shipping times, and export destinations — or chat
              freely with AI.
            </p>
            <div className="chat-window__suggestions">
              <button type="button" onClick={() => onQuickSuggestion?.('import-cost')}>
                📦 Calculate import cost
              </button>
              <button type="button" onClick={() => onQuickSuggestion?.('moq')}>
                What is MOQ?
              </button>
              <button type="button" onClick={() => onQuickSuggestion?.('uae')}>
                Do you export to UAE?
              </button>
            </div>
          </div>
        )}

        {messages.map((message, index) => {
          const isLast = index === messages.length - 1;
          if (
            isLoading &&
            isLast &&
            message.role === 'assistant' &&
            message.type !== 'estimate' &&
            !message.content?.trim()
          ) {
            return null;
          }

          return (
            <Message
              key={message.id}
              message={message}
              isStreaming={
                isLoading && isLast && message.role === 'assistant' && message.type !== 'estimate'
              }
              isLastAssistant={
                message.role === 'assistant' &&
                message.type !== 'estimate' &&
                index === messages.length - 1
              }
              onRegenerate={onRegenerate}
              canRegenerate={!isLoading}
              onRequestQuote={onRequestQuote}
            />
          );
        })}

        {showTyping && <TypingIndicator />}

        {error && (
          <div className="chat-window__error" role="alert">
            <span className="chat-window__error-icon" aria-hidden="true">
              ⚠
            </span>
            <p>{error}</p>
            <button type="button" className="chat-window__error-dismiss" onClick={onDismissError}>
              Dismiss
            </button>
          </div>
        )}

        <div ref={messagesEndRef} className="chat-window__anchor" />
      </div>
    </section>
  );
}

export default ChatWindow;

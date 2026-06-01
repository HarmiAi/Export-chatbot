import { useEffect, useRef } from 'react';
import QuickActions from './QuickActions';

function MessageInput({
  onSend,
  isLoading,
  onStop,
  onQuickAction,
  wizardActive,
}) {
  const textareaRef = useRef(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  useEffect(() => {
    adjustHeight();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const value = textareaRef.current?.value ?? '';
    if (!value.trim() || isLoading) return;
    onSend(value);
    if (textareaRef.current) {
      textareaRef.current.value = '';
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="message-input">
      <QuickActions
        onAction={onQuickAction}
        wizardActive={wizardActive}
        disabled={isLoading}
      />

      <div className="message-input__glass">
        <textarea
          ref={textareaRef}
          className="message-input__textarea"
          placeholder={
            wizardActive
              ? 'Type your answer… (Enter to send)'
              : 'Ask about exports, MOQ, shipping… (Enter to send, Shift+Enter for new line)'
          }
          rows={1}
          onKeyDown={handleKeyDown}
          onInput={adjustHeight}
          aria-label="Message input"
        />
        <div className="message-input__toolbar">
          <span className="message-input__hint">Shift + Enter for new line</span>
          {isLoading ? (
            <button
              type="button"
              className="message-input__send message-input__send--stop"
              onClick={onStop}
              aria-label="Stop generating"
            >
              <span className="message-input__stop-icon" aria-hidden="true" />
              Stop
            </button>
          ) : (
            <button
              type="button"
              className="message-input__send"
              onClick={handleSubmit}
              aria-label="Send message"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 19V5M5 12l7-7 7 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
      <p className="message-input__disclaimer">
        Estimates are indicative only. Request an official quotation for exact pricing.
      </p>
    </div>
  );
}

export default MessageInput;

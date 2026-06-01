function TypingIndicator() {
  return (
    <div className="typing-indicator" aria-live="polite" aria-label="Gemini is typing">
      <div className="typing-indicator__avatar" aria-hidden="true">
        E
      </div>
      <div className="typing-indicator__bubble">
        <span className="typing-indicator__dot" />
        <span className="typing-indicator__dot" />
        <span className="typing-indicator__dot" />
      </div>
    </div>
  );
}

export default TypingIndicator;

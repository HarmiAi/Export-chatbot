import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import EstimateCard from './EstimateCard';

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function CodeBlock({ inline, className, children, ...props }) {
  const match = /language-(\w+)/.exec(className || '');
  const code = String(children).replace(/\n$/, '');

  if (!inline && match) {
    return (
      <div className="message__code-wrap">
        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
          customStyle={{
            margin: 0,
            borderRadius: '12px',
            fontSize: '0.85rem',
          }}
          {...props}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
}

function Message({
  message,
  isStreaming,
  isLastAssistant,
  onRegenerate,
  canRegenerate,
  onRequestQuote,
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isEstimate = message.type === 'estimate' && message.estimateData;

  const handleCopy = async () => {
    const text = isEstimate ? message.content : message.content;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <article
      className={`message ${isUser ? 'message--user' : 'message--assistant'} ${isStreaming ? 'message--streaming' : ''} ${isEstimate ? 'message--estimate' : ''}`}
    >
      <div className={`message__avatar message__avatar--${isUser ? 'user' : 'ai'}`} aria-hidden="true">
        {isUser ? 'Y' : 'E'}
      </div>

      <div className="message__body">
        <header className="message__header">
          <span className="message__author">{isUser ? 'You' : 'Export Assistant'}</span>
          <time className="message__time" dateTime={new Date(message.timestamp).toISOString()}>
            {formatTime(message.timestamp)}
          </time>
        </header>

        {isEstimate ? (
          <EstimateCard estimate={message.estimateData} onRequestQuote={onRequestQuote} />
        ) : (
          <div className="message__bubble">
            {isUser ? (
              <p className="message__text">{message.content}</p>
            ) : message.content ? (
              <div className="message__markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : isStreaming ? (
              <span className="message__placeholder">Thinking…</span>
            ) : null}
          </div>
        )}

        {!isUser && !isEstimate && message.content && (
          <div className="message__actions">
            <button type="button" className="message__action-btn" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
            {isLastAssistant && canRegenerate && (
              <button type="button" className="message__action-btn" onClick={onRegenerate}>
                Regenerate
              </button>
            )}
          </div>
        )}

        {isEstimate && (
          <div className="message__actions">
            <button type="button" className="message__action-btn" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy estimate'}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export default Message;

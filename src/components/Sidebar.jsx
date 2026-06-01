function Sidebar({
  chats,
  activeChatId,
  onNewChat,
  onClearChat,
  onExportTxt,
  onExportJson,
  onSelectChat,
  onDeleteChat,
  hasMessages,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar__inner">
        <div className="sidebar__brand">
          <span className="sidebar__logo" aria-hidden="true">
            ✦
          </span>
          <span className="sidebar__name">Ever Fresh International</span>
        </div>

        <button type="button" className="sidebar__btn sidebar__btn--primary" onClick={onNewChat}>
          <span className="sidebar__btn-icon" aria-hidden="true">
            +
          </span>
          New chat
        </button>

        <nav className="sidebar__nav" aria-label="Chat history">
          <p className="sidebar__section-label">Recent</p>
          <ul className="sidebar__chat-list">
            {chats.map((chat) => (
              <li key={chat.id} className="sidebar__chat-item">
                <button
                  type="button"
                  className={`sidebar__chat-btn ${chat.id === activeChatId ? 'sidebar__chat-btn--active' : ''}`}
                  onClick={() => onSelectChat(chat.id)}
                  title={chat.title}
                >
                  <span className="sidebar__chat-icon" aria-hidden="true">
                    💬
                  </span>
                  <span className="sidebar__chat-title">{chat.title}</span>
                </button>
                {chats.length > 1 && (
                  <button
                    type="button"
                    className="sidebar__delete-btn"
                    onClick={() => onDeleteChat(chat.id)}
                    aria-label={`Delete ${chat.title}`}
                    title="Delete chat"
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar__actions">
          <p className="sidebar__section-label">Actions</p>
          <button
            type="button"
            className="sidebar__btn"
            onClick={onClearChat}
            disabled={!hasMessages}
          >
            Clear chat
          </button>
          <button
            type="button"
            className="sidebar__btn"
            onClick={onExportTxt}
            disabled={!hasMessages}
          >
            Export as TXT
          </button>
          <button
            type="button"
            className="sidebar__btn"
            onClick={onExportJson}
            disabled={!hasMessages}
          >
            Export as JSON
          </button>
        </div>

        <footer className="sidebar__footer">
          <p>Secure local storage</p>
          <p className="sidebar__footer-muted">API key stays in .env</p>
        </footer>
      </div>
    </aside>
  );
}

export default Sidebar;

import { useChat } from './hooks/useChat';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import MessageInput from './components/MessageInput';
import QuoteModal from './components/QuoteModal';

function App() {
  const {
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
  } = useChat();

  return (
    <div className="app">
      <div className="app__bg" aria-hidden="true" />
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={newChat}
        onClearChat={clearChat}
        onExportTxt={handleExportTxt}
        onExportJson={handleExportJson}
        onSelectChat={selectChat}
        onDeleteChat={deleteChat}
        hasMessages={messages.length > 0}
      />
      <main className="app__main">
        <header className="app__header">
          <div className="app__header-brand">
            <span className="app__logo" aria-hidden="true">
              📦
            </span>
            <div>
              <h1 className="app__title">{activeChat?.title || 'Export Assistant'}</h1>
              <p className="app__subtitle">Import Cost Calculator · Ever Fresh International</p>
            </div>
          </div>
        </header>

        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          error={error}
          onDismissError={() => setError(null)}
          messagesEndRef={messagesEndRef}
          onRegenerate={regenerateResponse}
          onRequestQuote={openQuoteModal}
          onQuickSuggestion={handleQuickAction}
        />

        <MessageInput
          onSend={sendMessage}
          isLoading={isLoading}
          onStop={stopGenerating}
          onQuickAction={handleQuickAction}
          wizardActive={wizardActive}
        />
      </main>

      <QuoteModal
        isOpen={quoteModal.open}
        productName={quoteModal.product}
        onClose={closeQuoteModal}
        onSubmit={submitQuoteRequest}
      />
    </div>
  );
}

export default App;

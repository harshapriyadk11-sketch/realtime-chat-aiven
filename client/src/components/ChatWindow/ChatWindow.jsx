import React from 'react';
import ChatHeader from './ChatHeader';
import ConnectionBanner from './ConnectionBanner';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import EmptyChat from './EmptyChat';

export default function ChatWindow({
  activeConversation,
  messages,
  currentUserId,
  connectionStatus,
  isLoadingMessages,
  isPartnerTyping,
  onSendMessage,
  onTyping,
  onBackToSidebar,
  onRefreshHistory,
  onRetryConnection
}) {
  if (!activeConversation) {
    return (
      <main className="chat-window">
        <EmptyChat />
      </main>
    );
  }

  return (
    <main className="chat-window">
      <ChatHeader
        activeConversation={activeConversation}
        onBackToSidebar={onBackToSidebar}
        onRefreshHistory={onRefreshHistory}
      />

      <ConnectionBanner
        status={connectionStatus}
        onRetry={onRetryConnection}
      />

      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        isLoading={isLoadingMessages}
      />

      {isPartnerTyping && (
        <div className="typing-indicator-row" aria-live="polite">
          <div className="typing-bubble">
            <span>{activeConversation.partner?.display_name || 'Partner'} is typing</span>
            <span className="typing-dots">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </span>
          </div>
        </div>
      )}

      <MessageInput
        onSendMessage={onSendMessage}
        onTyping={onTyping}
        disabled={connectionStatus === 'disconnected'}
      />
    </main>
  );
}

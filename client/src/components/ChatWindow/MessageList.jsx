import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import MessageSkeleton from '../Skeletons/MessageSkeleton';

function formatDateDivider(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MessageList({ messages, currentUserId, isLoading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return <MessageSkeleton />;
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="message-list" role="log" aria-live="polite">
        <div className="date-divider" style={{ marginTop: 'auto', marginBottom: 'auto' }}>
          <span className="date-divider-text">
            No messages yet. Say hello to start the conversation!
          </span>
        </div>
        <div ref={bottomRef} />
      </div>
    );
  }

  return (
    <div className="message-list" role="log" aria-live="polite">
      {messages.map((msg, index) => {
        const prevMsg = messages[index - 1];
        const isSender = msg.sender_id === currentUserId;

        // Check if day changed
        const msgDate = new Date(msg.created_at).toDateString();
        const prevDate = prevMsg ? new Date(prevMsg.created_at).toDateString() : null;
        const showDateDivider = !prevMsg || msgDate !== prevDate;

        // Check consecutive grouping (same sender and within 2 minutes)
        let isConsecutive = false;
        if (prevMsg && prevMsg.sender_id === msg.sender_id && !showDateDivider) {
          const diffMs = Math.abs(new Date(msg.created_at) - new Date(prevMsg.created_at));
          if (diffMs < 120000) {
            isConsecutive = true;
          }
        }

        return (
          <React.Fragment key={msg.id || index}>
            {showDateDivider && (
              <div className="date-divider">
                <span className="date-divider-text">{formatDateDivider(msg.created_at)}</span>
              </div>
            )}
            <MessageBubble
              message={msg}
              isSender={isSender}
              isConsecutive={isConsecutive}
            />
          </React.Fragment>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

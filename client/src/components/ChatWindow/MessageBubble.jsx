import React from 'react';

function formatTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, isSender, isConsecutive }) {
  const timeFormatted = formatTime(message.created_at);

  return (
    <div className={`message-row ${isSender ? 'sender' : 'receiver'} ${isConsecutive ? 'consecutive' : ''}`}>
      <div className="message-bubble">
        <div className="message-content">{message.content}</div>
        <div className="message-meta">
          <span className="message-timestamp">{timeFormatted}</span>
          {isSender && (
            <span
              className={`delivery-check ${message.read_at ? 'read' : ''}`}
              title={
                message.read_at
                  ? `Read at ${formatTime(message.read_at)}`
                  : 'Delivered (Saved to PostgreSQL)'
              }
            >
              {message.read_at ? (
                // Double check icon
                <svg width="15" height="12" viewBox="0 0 20 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 6l4 4L13 2" />
                  <path d="M7 6l4 4L19 2" />
                </svg>
              ) : (
                // Single check icon
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

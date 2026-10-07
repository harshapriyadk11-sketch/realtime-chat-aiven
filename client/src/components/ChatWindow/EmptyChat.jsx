import React from 'react';

export default function EmptyChat() {
  return (
    <div className="empty-state" aria-label="No conversation selected">
      <div className="empty-state-icon-box">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <h2 className="empty-state-title">Your Messages</h2>
      <p className="empty-state-desc">
        Select a conversation from the sidebar to start instant real-time messaging.
      </p>
    </div>
  );
}

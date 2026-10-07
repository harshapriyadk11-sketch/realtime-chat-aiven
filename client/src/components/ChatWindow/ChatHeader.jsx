import React from 'react';

function formatLastSeen(lastSeenString) {
  if (!lastSeenString) return 'Offline';
  const date = new Date(lastSeenString);
  if (isNaN(date.getTime())) return 'Offline';

  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Last seen just now';
  if (diffSec < 3600) return `Last seen ${Math.floor(diffSec / 60)}m ago`;

  const isToday = date.toDateString() === now.toDateString();
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Last seen today at ${timeStr}`;

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Last seen yesterday at ${timeStr}`;

  return `Last seen on ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
}

export default function ChatHeader({ activeConversation, onBackToSidebar, onRefreshHistory }) {
  if (!activeConversation) return null;

  const { partner } = activeConversation;
  const initials = partner?.display_name
    ? partner.display_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'P';

  const statusText = partner?.is_online 
    ? 'Online' 
    : formatLastSeen(partner?.last_seen);

  return (
    <header className="chat-header">
      <div className="chat-header-partner">
        <button 
          type="button" 
          className="btn-mobile-back" 
          onClick={onBackToSidebar}
          aria-label="Back to conversations"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="avatar-wrapper">
          <div className="avatar" style={{ backgroundColor: partner?.avatar_color || '#059669', width: '36px', height: '36px', fontSize: '0.8125rem' }}>
            {initials}
          </div>
          <span 
            className={`status-dot ${partner?.is_online ? 'online' : 'offline'}`}
            style={{ width: '9px', height: '9px' }}
          />
        </div>

        <div className="partner-info">
          <h1 className="partner-name">{partner?.display_name || 'Chat'}</h1>
          <div className={`partner-status ${partner?.is_online ? 'online' : 'offline'}`}>
            <span className={`partner-status-dot ${partner?.is_online ? 'online' : 'offline'}`} />
            {statusText}
          </div>
        </div>
      </div>

      <div className="chat-header-actions">
        {onRefreshHistory && (
          <button 
            type="button" 
            className="btn-icon-action" 
            onClick={onRefreshHistory}
            title="Reload message history from database"
            aria-label="Refresh message history"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}

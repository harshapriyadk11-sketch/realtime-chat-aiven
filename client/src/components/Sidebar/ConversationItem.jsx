import React from 'react';

function formatMessageTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ConversationItem({ conversation, isActive, onSelect }) {
  const { partner, last_message, unread_count } = conversation;
  const initials = partner?.display_name
    ? partner.display_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'P';

  const timeString = last_message ? formatMessageTime(last_message.created_at) : '';

  return (
    <button
      type="button"
      className={`conversation-item ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(conversation)}
      aria-selected={isActive}
    >
      <div className="avatar-wrapper">
        <div className="avatar" style={{ backgroundColor: partner?.avatar_color || '#059669' }}>
          {initials}
        </div>
        <span 
          className={`status-dot ${partner?.is_online ? 'online' : 'offline'}`}
          title={partner?.is_online ? 'Online' : 'Offline'}
        />
      </div>

      <div className="conversation-item-content">
        <div className="conversation-item-top">
          <span className="conversation-partner-name">{partner?.display_name || 'Conversation'}</span>
          {timeString && <span className="conversation-timestamp">{timeString}</span>}
        </div>
        <div className="conversation-item-bottom">
          <span className="conversation-snippet">
            {last_message ? last_message.content : 'No messages yet'}
          </span>
          {unread_count > 0 && (
            <span className="badge-unread">{unread_count}</span>
          )}
        </div>
      </div>
    </button>
  );
}

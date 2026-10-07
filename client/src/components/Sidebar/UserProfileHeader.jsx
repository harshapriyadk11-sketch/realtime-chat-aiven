import React from 'react';

export default function UserProfileHeader({ currentUser, onSwitchUser, connectionStatus }) {
  if (!currentUser) return null;

  const initials = currentUser.display_name
    ? currentUser.display_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'U';

  return (
    <div className="user-profile-header">
      <div className="user-badge-container">
        <div className="avatar-wrapper">
          <div className="avatar" style={{ backgroundColor: currentUser.avatar_color || '#2563eb' }}>
            {initials}
          </div>
          <span 
            className={`status-dot ${connectionStatus === 'connected' ? 'online' : 'offline'}`} 
            title={connectionStatus === 'connected' ? 'Connected' : 'Offline'}
          />
        </div>
        <div className="user-text-info">
          <span className="user-display-name">{currentUser.display_name}</span>
          <span className="user-tag">
            {currentUser.username === 'alex_rivers' ? 'Demo User 1' : 'Demo User 2'}
          </span>
        </div>
      </div>

      <button 
        type="button" 
        className="btn-switch-user" 
        onClick={onSwitchUser}
        title="Switch between Demo User 1 (Alex) and Demo User 2 (Sam)"
        aria-label="Switch test user"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8v12M17 20l4-4M17 20l-4-4"/>
        </svg>
        Switch
      </button>
    </div>
  );
}

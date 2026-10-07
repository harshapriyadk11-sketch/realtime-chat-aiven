import React, { useState } from 'react';
import UserProfileHeader from './UserProfileHeader';
import ConversationItem from './ConversationItem';
import SidebarSkeleton from '../Skeletons/SidebarSkeleton';

export default function Sidebar({
  currentUser,
  conversations,
  activeConversation,
  onSelectConversation,
  onSwitchUser,
  connectionStatus,
  isLoading
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const name = c.partner?.display_name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <aside className="sidebar" aria-label="Chat conversations">
      <UserProfileHeader 
        currentUser={currentUser} 
        onSwitchUser={onSwitchUser} 
        connectionStatus={connectionStatus} 
      />

      <div className="sidebar-search-container">
        <div className="search-input-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            className="sidebar-search-input"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search conversations"
          />
        </div>
      </div>

      <div className="sidebar-section-title">Direct Messages</div>

      {isLoading ? (
        <SidebarSkeleton />
      ) : (
        <div className="conversation-list" role="list">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={activeConversation?.id === conv.id}
                onSelect={onSelectConversation}
              />
            ))
          ) : (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              No conversations found
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

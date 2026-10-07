import React from 'react';

export default function SidebarSkeleton() {
  return (
    <div className="conversation-list">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton-sidebar-item">
          <div className="skeleton skeleton-avatar" />
          <div className="skeleton-text-col">
            <div className="skeleton skeleton-line-title" />
            <div className="skeleton skeleton-line-sub" />
          </div>
        </div>
      ))}
    </div>
  );
}

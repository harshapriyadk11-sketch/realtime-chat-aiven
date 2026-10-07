import React from 'react';

export default function MessageSkeleton() {
  return (
    <div className="message-list" style={{ overflow: 'hidden' }}>
      <div className="message-row receiver">
        <div className="skeleton message-bubble" style={{ width: '220px', height: '48px' }} />
      </div>
      <div className="message-row sender">
        <div className="skeleton message-bubble" style={{ width: '280px', height: '56px' }} />
      </div>
      <div className="message-row receiver">
        <div className="skeleton message-bubble" style={{ width: '180px', height: '44px' }} />
      </div>
    </div>
  );
}

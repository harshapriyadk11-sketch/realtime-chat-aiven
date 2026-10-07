import React from 'react';

export default function ConnectionBanner({ status, onRetry }) {
  if (status === 'connected') return null;

  return (
    <div className={`connection-banner ${status}`} role="alert">
      {status === 'reconnecting' && (
        <>
          <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19" />
          </svg>
          <span>Reconnecting to real-time chat service...</span>
        </>
      )}

      {status === 'disconnected' && (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>Disconnected from server.</span>
          {onRetry && (
            <button type="button" className="btn-retry" onClick={onRetry}>
              Retry Now
            </button>
          )}
        </>
      )}
    </div>
  );
}

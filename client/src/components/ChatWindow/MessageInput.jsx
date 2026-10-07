import React, { useState, useRef } from 'react';

export default function MessageInput({ onSendMessage, onTyping, disabled }) {
  const [content, setContent] = useState('');
  const textareaRef = useRef(null);
  const typingTimerRef = useRef(null);

  const handleInput = (e) => {
    setContent(e.target.value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }

    // Trigger typing event with 2s debounce
    if (onTyping) {
      onTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() || disabled) return;

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (onTyping) onTyping(false);

    onSendMessage(content.trim());
    setContent('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleBlur = () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (onTyping) onTyping(false);
  };

  const isSendDisabled = !content.trim() || disabled;

  return (
    <div className="message-composer-container">
      <form className="composer-form" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className="composer-textarea"
          placeholder="Type a message... (Press Enter to send, Shift+Enter for new line)"
          rows="1"
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={disabled}
          aria-label="Message text"
        />

        <button
          type="submit"
          className="btn-send"
          disabled={isSendDisabled}
          aria-label="Send message"
          title="Send message"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  );
}

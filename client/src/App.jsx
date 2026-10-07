import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import ChatWindow from './components/ChatWindow/ChatWindow';
import { fetchUsers, fetchConversations, fetchMessages } from './services/api';
import { initSocket, getSocket, disconnectSocket } from './services/socket';
import './styles/base.css';
import './styles/chat.css';

export default function App() {
  // Determine initial user from URL or session storage
  const getInitialUserId = () => {
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get('user');
    if (userParam === 'user_1' || userParam === 'user_2') return userParam;
    return sessionStorage.getItem('activeUserId') || 'user_1';
  };

  const [currentUserId, setCurrentUserId] = useState(getInitialUserId);
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [mobileView, setMobileView] = useState('conversations'); // 'conversations' | 'chat'

  const activeConversationRef = useRef(activeConversation);
  activeConversationRef.current = activeConversation;

  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;

  // Sync session storage & URL
  useEffect(() => {
    sessionStorage.setItem('activeUserId', currentUserId);
    const url = new URL(window.location);
    if (url.searchParams.get('user') !== currentUserId) {
      url.searchParams.set('user', currentUserId);
      window.history.replaceState({}, '', url);
    }
  }, [currentUserId]);

  // Load users list
  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch((err) => console.error('[API] Error loading users:', err));
  }, []);

  const currentUser = users.find((u) => u.id === currentUserId) || {
    id: currentUserId,
    username: currentUserId === 'user_1' ? 'alex_rivers' : 'sam_chen',
    display_name: currentUserId === 'user_1' ? 'Alex Rivers' : 'Sam Chen',
    avatar_color: currentUserId === 'user_1' ? '#2563eb' : '#059669'
  };

  // Switch demo user
  const handleSwitchUser = () => {
    const nextUserId = currentUserId === 'user_1' ? 'user_2' : 'user_1';
    setCurrentUserId(nextUserId);
    setActiveConversation(null);
    setMessages([]);
    setIsPartnerTyping(false);
  };

  // Mark unread messages as read
  const markMessagesAsRead = useCallback((convId) => {
    if (!convId) return;
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('mark_messages_read', {
        conversationId: convId,
        readerId: currentUserIdRef.current
      });
    }
  }, []);

  // Load conversations for current user
  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const convs = await fetchConversations(currentUserId);
      setConversations(convs);
      // Auto-select first conversation if none selected
      if (convs.length > 0 && !activeConversationRef.current) {
        setActiveConversation(convs[0]);
      }
    } catch (err) {
      console.error('[API] Error loading conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load message history when active conversation changes
  const loadHistory = useCallback(async (convId) => {
    if (!convId) return;
    setIsLoadingMessages(true);
    try {
      const msgs = await fetchMessages(convId);
      setMessages(msgs);

      // Check if unread incoming messages exist, mark them as read
      const hasUnread = msgs.some(
        (m) => m.sender_id !== currentUserIdRef.current && !m.read_at
      );
      if (hasUnread) {
        markMessagesAsRead(convId);
      }
    } catch (err) {
      console.error('[API] Error loading messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [markMessagesAsRead]);

  useEffect(() => {
    if (activeConversation?.id) {
      setIsPartnerTyping(false);
      loadHistory(activeConversation.id);
      // Join socket room
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('join_conversation', { conversationId: activeConversation.id });
      }
    }
  }, [activeConversation?.id, loadHistory]);

  // Setup Socket.IO connection
  useEffect(() => {
    const socket = initSocket(currentUserId, (status) => {
      setConnectionStatus(status);
    });

    socket.on('connect', () => {
      if (activeConversationRef.current?.id) {
        socket.emit('join_conversation', { conversationId: activeConversationRef.current.id });
      }
    });

    // Real-time message receiver
    socket.on('new_message', (newMsg) => {
      console.log('[SOCKET] Received new message:', newMsg);
      // Reset partner typing indicator when message arrives
      if (activeConversationRef.current?.id === newMsg.conversation_id) {
        setIsPartnerTyping(false);
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        // If message is from partner and chat is open, immediately mark as read
        if (newMsg.sender_id !== currentUserIdRef.current) {
          socket.emit('mark_messages_read', {
            conversationId: newMsg.conversation_id,
            readerId: currentUserIdRef.current
          });
        }
      }

      // Update last message in sidebar
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === newMsg.conversation_id) {
            return {
              ...c,
              last_message: newMsg,
              updated_at: newMsg.created_at
            };
          }
          return c;
        })
      );
    });

    // Real-time read receipts
    socket.on('messages_read', ({ conversationId, readAt, messageIds }) => {
      console.log('[SOCKET] Messages marked read:', messageIds);
      if (activeConversationRef.current?.id === conversationId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (messageIds.includes(m.id)) {
              return { ...m, read_at: readAt };
            }
            return m;
          })
        );
      }
    });

    // Real-time typing indicators
    socket.on('partner_typing_start', ({ conversationId, userId }) => {
      if (
        activeConversationRef.current?.id === conversationId &&
        userId !== currentUserIdRef.current
      ) {
        setIsPartnerTyping(true);
      }
    });

    socket.on('partner_typing_stop', ({ conversationId, userId }) => {
      if (
        activeConversationRef.current?.id === conversationId &&
        userId !== currentUserIdRef.current
      ) {
        setIsPartnerTyping(false);
      }
    });

    // User online status & last seen update
    socket.on('user_status_changed', ({ userId, is_online, last_seen }) => {
      console.log('[SOCKET] User status changed:', userId, is_online, last_seen);
      setConversations((prev) =>
        prev.map((c) => {
          if (c.partner?.id === userId) {
            return {
              ...c,
              partner: {
                ...c.partner,
                is_online,
                last_seen: last_seen || c.partner.last_seen
              }
            };
          }
          return c;
        })
      );

      setActiveConversation((prev) => {
        if (prev && prev.partner?.id === userId) {
          return {
            ...prev,
            partner: {
              ...prev.partner,
              is_online,
              last_seen: last_seen || prev.partner.last_seen
            }
          };
        }
        return prev;
      });
    });

    return () => {
      disconnectSocket();
    };
  }, [currentUserId]);

  // Handle select conversation
  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    setMobileView('chat');
  };

  // Handle typing from message input
  const handleTyping = (isTyping) => {
    if (!activeConversation) return;
    const socket = getSocket();
    if (!socket || !socket.connected) return;

    if (isTyping) {
      socket.emit('typing_start', {
        conversationId: activeConversation.id,
        userId: currentUserId,
        userName: currentUser.display_name
      });
    } else {
      socket.emit('typing_stop', {
        conversationId: activeConversation.id,
        userId: currentUserId
      });
    }
  };

  // Handle sending message via Socket.IO
  const handleSendMessage = (content) => {
    if (!activeConversation || !content.trim()) return;

    const socket = getSocket();
    if (!socket || !socket.connected) {
      console.error('[SOCKET ERROR] Socket not connected.');
      return;
    }

    socket.emit(
      'send_message',
      {
        conversationId: activeConversation.id,
        senderId: currentUserId,
        content: content.trim()
      },
      (response) => {
        if (!response?.success) {
          console.error('[SEND MESSAGE ERROR]', response?.error);
        }
      }
    );
  };

  // Reconnect retry
  const handleRetryConnection = () => {
    initSocket(currentUserId, setConnectionStatus);
  };

  return (
    <div className={`app-container mobile-view-${mobileView}`}>
      <Sidebar
        currentUser={currentUser}
        conversations={conversations}
        activeConversation={activeConversation}
        onSelectConversation={handleSelectConversation}
        onSwitchUser={handleSwitchUser}
        connectionStatus={connectionStatus}
        isLoading={isLoadingConversations}
      />

      <ChatWindow
        activeConversation={activeConversation}
        messages={messages}
        currentUserId={currentUserId}
        connectionStatus={connectionStatus}
        isLoadingMessages={isLoadingMessages}
        isPartnerTyping={isPartnerTyping}
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        onBackToSidebar={() => setMobileView('conversations')}
        onRefreshHistory={() => activeConversation && loadHistory(activeConversation.id)}
        onRetryConnection={handleRetryConnection}
      />
    </div>
  );
}

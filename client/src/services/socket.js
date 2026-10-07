import { io } from 'socket.io-client';

const SOCKET_URL = 'http://realtime-chat-aiven.onrender.com';

let socket = null;

export function getSocket() {
  return socket;
}

export function initSocket(userId, onStatusChange) {
  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    query: { userId },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  if (onStatusChange) {
    socket.on('connect', () => {
      console.log('[SOCKET] Connected to real-time server with id:', socket.id);
      onStatusChange('connected');
    });

    socket.on('disconnect', (reason) => {
      console.log('[SOCKET] Disconnected:', reason);
      onStatusChange('disconnected');
    });

    socket.on('connect_error', (error) => {
      console.warn('[SOCKET] Connection error:', error.message);
      onStatusChange('reconnecting');
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

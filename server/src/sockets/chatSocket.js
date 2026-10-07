import crypto from 'crypto';
import { query } from '../db/index.js';

// Map of userId -> Set of socketIds
const onlineUsers = new Map();

export function setupChatSocket(io) {
  io.on('connection', (socket) => {
    let currentUserId = socket.handshake.query?.userId || null;

    console.log(`[SOCKET CONNECTED] Socket ID: ${socket.id}`);

    // Register user presence
    const registerUser = async (userId) => {
      if (!userId) return;
      currentUserId = userId;
      socket.userId = userId;

      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId).add(socket.id);

      try {
        await query(`
          UPDATE users 
          SET is_online = true 
          WHERE id = $1;
        `, [userId]);

        io.emit('user_status_changed', {
          userId,
          is_online: true
        });
        const connCount = onlineUsers.get(userId)?.size || 1;
        console.log(`[USER ONLINE] ${userId} (${connCount} active connections)`);
      } catch (err) {
        console.error('[STATUS ERROR] Failed to update user online status:', err.message);
      }
    };

    if (currentUserId) {
      registerUser(currentUserId);
    }

    socket.on('user_connected', async ({ userId }) => {
      await registerUser(userId);
    });

    // Join conversation room
    socket.on('join_conversation', ({ conversationId }) => {
      if (!conversationId) return;
      const room = `conversation:${conversationId}`;
      socket.join(room);
      console.log(`[ROOM JOIN] Socket ${socket.id} (User: ${currentUserId}) joined ${room}`);
    });

    // Leave conversation room
    socket.on('leave_conversation', ({ conversationId }) => {
      if (!conversationId) return;
      const room = `conversation:${conversationId}`;
      socket.leave(room);
      console.log(`[ROOM LEAVE] Socket ${socket.id} left ${room}`);
    });

    // Send message (Persist FIRST, then broadcast)
    socket.on('send_message', async (data, callback) => {
      const { conversationId, senderId, content } = data;

      if (!conversationId || !senderId || !content || !content.trim()) {
        const errPayload = { success: false, error: 'Invalid message payload' };
        if (typeof callback === 'function') callback(errPayload);
        return;
      }

      const trimmedContent = content.trim();
      const messageId = 'msg_' + crypto.randomUUID();

      try {
        // 1. PERSIST TO POSTGRESQL FIRST
        const { rows } = await query(`
          INSERT INTO messages (id, conversation_id, sender_id, content, created_at)
          VALUES ($1, $2, $3, $4, NOW())
          RETURNING id, conversation_id, sender_id, content, created_at, read_at;
        `, [messageId, conversationId, senderId, trimmedContent]);

        const savedMessage = rows[0];

        // Update conversation timestamp
        await query(`
          UPDATE conversations 
          SET updated_at = NOW() 
          WHERE id = $1;
        `, [conversationId]);

        // Get sender details
        const { rows: userRows } = await query(`
          SELECT display_name, avatar_color 
          FROM users 
          WHERE id = $1;
        `, [senderId]);

        const fullMessage = {
          ...savedMessage,
          sender_name: userRows[0]?.display_name || 'User',
          sender_avatar_color: userRows[0]?.avatar_color || '#2563eb'
        };

        // 2. ONLY AFTER PERSISTENCE: BROADCAST TO CONVERSATION ROOM
        const room = `conversation:${conversationId}`;
        io.to(room).emit('new_message', fullMessage);

        // Also broadcast conversation update so sidebar updates last message
        io.emit('conversation_updated', {
          conversationId,
          last_message: fullMessage
        });

        console.log(`[MESSAGE PERSISTED & BROADCAST] Room: ${room}, MsgId: ${messageId}`);

        // Acknowledge to sender callback
        if (typeof callback === 'function') {
          callback({ success: true, message: fullMessage });
        }
      } catch (err) {
        console.error('[MESSAGE SAVE ERROR] Failed to persist message:', err.message);
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Failed to persist message: ' + err.message });
        }
      }
    });

    // Typing Indicators (ephemeral real-time broadcast)
    socket.on('typing_start', ({ conversationId, userId, userName }) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit('partner_typing_start', {
        conversationId,
        userId: userId || currentUserId,
        userName
      });
    });

    socket.on('typing_stop', ({ conversationId, userId }) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit('partner_typing_stop', {
        conversationId,
        userId: userId || currentUserId
      });
    });

    // Mark messages read (Aiven PostgreSQL persistent update)
    socket.on('mark_messages_read', async ({ conversationId, readerId }, callback) => {
      if (!conversationId || !readerId) return;
      try {
        const { rows } = await query(`
          UPDATE messages
          SET read_at = NOW()
          WHERE conversation_id = $1 
            AND sender_id != $2 
            AND read_at IS NULL
          RETURNING id, read_at;
        `, [conversationId, readerId]);

        if (rows.length > 0) {
          const readAt = rows[0].read_at;
          const messageIds = rows.map((r) => r.id);
          io.to(`conversation:${conversationId}`).emit('messages_read', {
            conversationId,
            readerId,
            readAt,
            messageIds
          });
          console.log(`[READ RECEIPTS] Marked ${rows.length} messages read in ${conversationId} by ${readerId}`);
        }
        if (typeof callback === 'function') callback({ success: true, count: rows.length });
      } catch (err) {
        console.error('[READ RECEIPT ERROR] Failed to update read receipts:', err.message);
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    // Disconnect handling
    socket.on('disconnect', async () => {
      console.log(`[SOCKET DISCONNECTED] Socket ID: ${socket.id}, User: ${currentUserId}`);
      if (currentUserId && onlineUsers.has(currentUserId)) {
        const userSet = onlineUsers.get(currentUserId);
        userSet.delete(socket.id);

        if (userSet.size === 0) {
          onlineUsers.delete(currentUserId);
          try {
            await query(`
              UPDATE users 
              SET is_online = false, last_seen = NOW() 
              WHERE id = $1;
            `, [currentUserId]);

            io.emit('user_status_changed', {
              userId: currentUserId,
              is_online: false,
              last_seen: new Date().toISOString()
            });
            console.log(`[USER OFFLINE] ${currentUserId}`);
          } catch (err) {
            console.error('[STATUS ERROR] Failed to update user offline status:', err.message);
          }
        }
      }
    });
  });
}

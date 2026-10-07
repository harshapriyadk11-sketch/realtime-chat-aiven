import { Router } from 'express';
import { query } from '../db/index.js';
import crypto from 'crypto';

const router = Router();

// Health Check
router.get('/health', async (req, res) => {
  try {
    const dbRes = await query('SELECT NOW() as current_time');
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: dbRes.rows[0].current_time
    });
  } catch (err) {
    res.status(500).json({ status: 'error', database: err.message });
  }
});

// GET /api/users - List all users
router.get('/users', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT id, username, display_name, avatar_color, is_online, last_seen, created_at
      FROM users
      ORDER BY id ASC;
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users: ' + err.message });
  }
});

// GET /api/users/:userId/conversations - List conversations for a specific user
router.get('/users/:userId/conversations', async (req, res) => {
  const { userId } = req.params;
  try {
    const { rows } = await query(`
      SELECT 
        c.id,
        c.title,
        c.updated_at,
        -- Partner info
        pu.id as partner_id,
        pu.username as partner_username,
        pu.display_name as partner_display_name,
        pu.avatar_color as partner_avatar_color,
        pu.is_online as partner_is_online,
        pu.last_seen as partner_last_seen,
        -- Latest message
        lm.id as last_message_id,
        lm.content as last_message_content,
        lm.sender_id as last_message_sender_id,
        lm.created_at as last_message_time
      FROM conversations c
      JOIN conversation_participants cp ON cp.conversation_id = c.id
      -- Join other participant
      JOIN conversation_participants other_cp 
        ON other_cp.conversation_id = c.id AND other_cp.user_id != $1
      JOIN users pu ON pu.id = other_cp.user_id
      -- Left join last message
      LEFT JOIN LATERAL (
        SELECT id, content, sender_id, created_at
        FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY created_at DESC
        LIMIT 1
      ) lm ON true
      WHERE cp.user_id = $1
      ORDER BY COALESCE(lm.created_at, c.updated_at) DESC;
    `, [userId]);

    // Format response
    const conversations = rows.map((r) => ({
      id: r.id,
      title: r.title,
      updated_at: r.updated_at,
      partner: {
        id: r.partner_id,
        username: r.partner_username,
        display_name: r.partner_display_name,
        avatar_color: r.partner_avatar_color,
        is_online: r.partner_is_online,
        last_seen: r.partner_last_seen
      },
      last_message: r.last_message_id ? {
        id: r.last_message_id,
        content: r.last_message_content,
        sender_id: r.last_message_sender_id,
        created_at: r.last_message_time
      } : null,
      unread_count: 0
    }));

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversations: ' + err.message });
  }
});

// GET /api/conversations/:conversationId/messages - Load message history
router.get('/conversations/:conversationId/messages', async (req, res) => {
  const { conversationId } = req.params;
  try {
    const { rows } = await query(`
      SELECT 
        m.id,
        m.conversation_id,
        m.sender_id,
        m.content,
        m.created_at,
        m.read_at,
        u.display_name as sender_name,
        u.avatar_color as sender_avatar_color
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC;
    `, [conversationId]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages: ' + err.message });
  }
});

// POST /api/conversations/:conversationId/messages - REST endpoint to create message
router.post('/conversations/:conversationId/messages', async (req, res) => {
  const { conversationId } = req.params;
  const { senderId, content } = req.body;

  if (!senderId || !content || !content.trim()) {
    return res.status(400).json({ error: 'senderId and non-empty content are required' });
  }

  const messageId = 'msg_' + crypto.randomUUID();

  try {
    const { rows } = await query(`
      INSERT INTO messages (id, conversation_id, sender_id, content, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, conversation_id, sender_id, content, created_at, read_at;
    `, [messageId, conversationId, senderId, content.trim()]);

    await query(`
      UPDATE conversations 
      SET updated_at = NOW() 
      WHERE id = $1;
    `, [conversationId]);

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save message: ' + err.message });
  }
});

export default router;

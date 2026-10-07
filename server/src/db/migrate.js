import pool, { query } from './index.js';

export async function runMigrations() {
  console.log('[MIGRATION] Starting database migration for Aiven PostgreSQL...');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        display_name VARCHAR(100) NOT NULL,
        avatar_color VARCHAR(20) DEFAULT '#2563eb',
        is_online BOOLEAN DEFAULT false,
        last_seen TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Conversations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Conversation participants table
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversation_participants (
        conversation_id VARCHAR(50) REFERENCES conversations(id) ON DELETE CASCADE,
        user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (conversation_id, user_id)
      );
    `);

    // 4. Messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(50) PRIMARY KEY,
        conversation_id VARCHAR(50) REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMPTZ
      );
    `);

    // 5. Indexes for fast retrieval
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
      ON messages (conversation_id, created_at ASC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_participants_user 
      ON conversation_participants (user_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_participants_conversation 
      ON conversation_participants (conversation_id);
    `);

    // 6. Seed demo users safely (Alex Rivers & Sam Chen)
    const seedUsers = [
      { id: 'user_1', username: 'alex_rivers', display_name: 'Alex Rivers', avatar_color: '#2563eb' },
      { id: 'user_2', username: 'sam_chen', display_name: 'Sam Chen', avatar_color: '#059669' }
    ];

    for (const u of seedUsers) {
      await client.query(`
        INSERT INTO users (id, username, display_name, avatar_color, is_online)
        VALUES ($1, $2, $3, $4, false)
        ON CONFLICT (id) DO UPDATE 
        SET display_name = EXCLUDED.display_name,
            avatar_color = EXCLUDED.avatar_color;
      `, [u.id, u.username, u.display_name, u.avatar_color]);
    }

    // 7. Seed primary 1-to-1 conversation
    const convId = 'conv_alex_sam';
    await client.query(`
      INSERT INTO conversations (id, title, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO NOTHING;
    `, [convId, 'Alex & Sam']);

    // Add participants
    await client.query(`
      INSERT INTO conversation_participants (conversation_id, user_id)
      VALUES ($1, 'user_1'), ($1, 'user_2')
      ON CONFLICT (conversation_id, user_id) DO NOTHING;
    `, [convId]);

    // Check if initial messages exist, if none seed starter messages
    const { rows: msgRows } = await client.query(
      `SELECT COUNT(*)::int as count FROM messages WHERE conversation_id = $1;`,
      [convId]
    );

    if (msgRows[0].count === 0) {
      await client.query(`
        INSERT INTO messages (id, conversation_id, sender_id, content, created_at)
        VALUES 
          ('msg_init_1', $1, 'user_2', 'Hey Alex! Welcome to our real-time chat application.', NOW() - INTERVAL '5 minutes'),
          ('msg_init_2', $1, 'user_1', 'Hey Sam! The obsidian dark theme looks great, and messages sync instantly.', NOW() - INTERVAL '2 minutes')
        ON CONFLICT (id) DO NOTHING;
      `, [convId]);
    }

    await client.query('COMMIT');
    console.log('[MIGRATION] Migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[MIGRATION FAILED]', err.message);
    throw err;
  } finally {
    client.release();
  }
}

// Run standalone if executed directly
if (process.argv[1]?.endsWith('migrate.js')) {
  runMigrations()
    .then(() => {
      console.log('[MIGRATION] Done. Exiting.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[MIGRATION] Error:', err);
      process.exit(1);
    });
}

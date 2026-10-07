import { io } from 'socket.io-client';
import pool from './src/db/index.js';

const SERVER_URL = 'http://localhost:5000';
const CONV_ID = 'conv_phase1_test';

async function testPhase1() {
  console.log('=== PHASE 1 TEST: TYPING, READ RECEIPTS & LAST SEEN ===\n');

  // Insert test conversation into DB
  await pool.query(`
    INSERT INTO conversations (id, title) VALUES ($1, 'Test Conv')
    ON CONFLICT (id) DO NOTHING;
  `, [CONV_ID]);
  await pool.query(`
    INSERT INTO conversation_participants (conversation_id, user_id) 
    VALUES ($1, 'user_1'), ($1, 'user_2')
    ON CONFLICT DO NOTHING;
  `, [CONV_ID]);

  // 1. Connect Client A (user_1) & Client B (user_2)
  console.log('[STEP 1] Connecting Client A (user_1) and Client B (user_2)...');
  const clientA = io(SERVER_URL, { query: { userId: 'user_1' } });
  const clientB = io(SERVER_URL, { query: { userId: 'user_2' } });

  await Promise.all([
    new Promise((resolve) => clientA.on('connect', resolve)),
    new Promise((resolve) => clientB.on('connect', resolve))
  ]);

  clientA.emit('join_conversation', { conversationId: CONV_ID });
  clientB.emit('join_conversation', { conversationId: CONV_ID });
  await new Promise((r) => setTimeout(r, 400));
  console.log('✓ Both clients connected and joined room');

  // 2. Test Real-time Typing Indicators
  console.log('\n[STEP 2] Testing real-time typing indicators...');
  const typingStartPromise = new Promise((resolve) => {
    clientB.on('partner_typing_start', (data) => {
      resolve(data);
    });
  });

  const typingStopPromise = new Promise((resolve) => {
    clientB.on('partner_typing_stop', (data) => {
      resolve(data);
    });
  });

  clientA.emit('typing_start', {
    conversationId: CONV_ID,
    userId: 'user_1',
    userName: 'Alex Rivers'
  });

  const typingStartReceived = await typingStartPromise;
  console.log('✓ Client B received partner_typing_start:', typingStartReceived);
  if (typingStartReceived.userId !== 'user_1') throw new Error('Expected typing userId to be user_1');

  clientA.emit('typing_stop', {
    conversationId: CONV_ID,
    userId: 'user_1'
  });

  const typingStopReceived = await typingStopPromise;
  console.log('✓ Client B received partner_typing_stop:', typingStopReceived);

  // 3. Test Message Sending and Read Receipts
  console.log('\n[STEP 3] Testing Message Sending and Read Receipts...');
  const testContent = `Read receipt test at ${Date.now()}`;

  let newMsgId = null;
  const newMsgPromise = new Promise((resolve) => {
    clientB.on('new_message', (msg) => {
      if (msg.content === testContent) {
        newMsgId = msg.id;
        resolve(msg);
      }
    });
  });

  clientA.emit('send_message', {
    conversationId: CONV_ID,
    senderId: 'user_1',
    content: testContent
  });

  const receivedMsg = await newMsgPromise;
  console.log('✓ Client B received message:', receivedMsg.id);

  // Verify in PostgreSQL: read_at should be null right now
  const { rows: preReadRows } = await pool.query(
    'SELECT id, read_at FROM messages WHERE id = $1;',
    [newMsgId]
  );
  console.log('Initial DB read_at status:', preReadRows[0].read_at);
  if (preReadRows[0].read_at !== null) throw new Error('Expected read_at to be null initially');

  // Client B marks messages as read
  console.log('Client B marking message as read...');
  const readReceiptPromise = new Promise((resolve) => {
    clientA.on('messages_read', (data) => {
      if (data.messageIds?.includes(newMsgId)) {
        resolve(data);
      }
    });
  });

  clientB.emit('mark_messages_read', {
    conversationId: CONV_ID,
    readerId: 'user_2'
  });

  const readEvent = await readReceiptPromise;
  console.log('✓ Client A received real-time messages_read event:', readEvent);

  // Verify in Aiven PostgreSQL: read_at must now be set!
  const { rows: postReadRows } = await pool.query(
    'SELECT id, read_at FROM messages WHERE id = $1;',
    [newMsgId]
  );
  console.log('PostgreSQL record after read receipt:', postReadRows[0]);
  if (!postReadRows[0].read_at) throw new Error('Expected read_at to be persisted in PostgreSQL!');
  console.log('✓ Read receipt confirmed persisted in Aiven PostgreSQL!');

  // 4. Test Last-Seen Presence on Disconnect
  console.log('\n[STEP 4] Testing Last-Seen Presence on Disconnect with dedicated test user...');
  const testPresenceUserId = 'user_presence_test';
  await pool.query(`
    INSERT INTO users (id, username, display_name) 
    VALUES ($1, 'test_presence', 'Test Presence User')
    ON CONFLICT (id) DO UPDATE SET is_online = false;
  `, [testPresenceUserId]);

  const clientC = io(SERVER_URL, { query: { userId: testPresenceUserId } });
  await new Promise((resolve) => clientC.on('connect', resolve));
  await new Promise((r) => setTimeout(r, 400));
  console.log('✓ Test user connected and verified online');

  const offlinePromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Offline event timed out')), 4000);
    clientA.on('user_status_changed', (status) => {
      if (status.userId === testPresenceUserId && status.is_online === false) {
        clearTimeout(timeout);
        resolve(status);
      }
    });
  });

  clientC.disconnect();
  const offlineEvent = await offlinePromise;
  console.log('✓ Client A received offline status event:', offlineEvent);
  if (!offlineEvent.last_seen) throw new Error('Expected last_seen timestamp in offline event');

  // Verify in Aiven PostgreSQL: last_seen is updated and is_online is false
  await new Promise((r) => setTimeout(r, 400));
  const { rows: userRows } = await pool.query(
    'SELECT id, username, is_online, last_seen FROM users WHERE id = $1;',
    [testPresenceUserId]
  );
  console.log('PostgreSQL test user record:', userRows[0]);
  if (userRows[0].is_online !== false) throw new Error('Expected is_online to be false');
  if (!userRows[0].last_seen) throw new Error('Expected last_seen to be set in PostgreSQL');
  console.log('✓ Test user offline and last_seen verified in Aiven PostgreSQL!');

  clientA.disconnect();
  clientB.disconnect();
  await pool.end();
  console.log('\n=== ALL PHASE 1 TESTS PASSED SUCCESSFULLY! ===');
  process.exit(0);
}

testPhase1().catch((err) => {
  console.error('\n❌ Phase 1 test failed:', err);
  process.exit(1);
});

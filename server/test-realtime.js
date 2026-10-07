import { io } from 'socket.io-client';
import pool from './src/db/index.js';

const SERVER_URL = 'http://localhost:5000';

async function testRealtimeFlow() {
  console.log('=== STARTING REAL-TIME SOCKET & POSTGRESQL VERIFICATION ===\n');

  // Step 1: Connect Client A (Alex Rivers - user_1)
  console.log('[TEST 1] Connecting Client A (User 1 - Alex Rivers)...');
  const clientA = io(SERVER_URL, { query: { userId: 'user_1' } });

  await new Promise((resolve) => clientA.on('connect', resolve));
  console.log('✓ Client A connected with socket id:', clientA.id);

  // Step 2: Connect Client B (Sam Chen - user_2)
  console.log('\n[TEST 2] Connecting Client B (User 2 - Sam Chen)...');
  const clientB = io(SERVER_URL, { query: { userId: 'user_2' } });

  await new Promise((resolve) => clientB.on('connect', resolve));
  console.log('✓ Client B connected with socket id:', clientB.id);

  // Wait 500ms for async DB updates to complete
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Step 3: Verify Online Status in PostgreSQL
  console.log('\n[TEST 3] Checking online status in Aiven PostgreSQL...');
  const { rows: userStatus } = await pool.query(
    'SELECT id, username, is_online FROM users WHERE id IN (\'user_1\', \'user_2\') ORDER BY id ASC;'
  );
  console.log('PostgreSQL Users Presence:', userStatus);
  if (!userStatus[0].is_online || !userStatus[1].is_online) {
    throw new Error('Expected both users to be online in database');
  }
  console.log('✓ Both users confirmed online in Aiven PostgreSQL!');

  // Step 4: Join conversation room
  const convId = 'conv_alex_sam';
  console.log(`\n[TEST 4] Joining room conversation:${convId}...`);
  clientA.emit('join_conversation', { conversationId: convId });
  clientB.emit('join_conversation', { conversationId: convId });
  await new Promise(r => setTimeout(r, 200));

  // Step 5: User 1 sends message -> User 2 receives via Socket.IO
  console.log('\n[TEST 5] Testing real-time message from User 1 -> User 2...');
  const testMsgContent = 'Automated Test Message: Real-time sync at ' + new Date().toISOString();

  const msgPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for message on Client B')), 5000);
    clientB.on('new_message', (msg) => {
      if (msg.content === testMsgContent) {
        clearTimeout(timeout);
        resolve(msg);
      }
    });
  });

  // Client A emits send_message with acknowledgement callback
  const ack = await new Promise((resolve) => {
    clientA.emit('send_message', {
      conversationId: convId,
      senderId: 'user_1',
      content: testMsgContent
    }, resolve);
  });

  console.log('Client A send acknowledgement:', ack);
  if (!ack?.success) throw new Error('Send message failed');

  const receivedMsg = await msgPromise;
  console.log('✓ Client B received message instantly over Socket.IO room:', receivedMsg);

  // Step 6: Verify message is in Aiven PostgreSQL
  console.log('\n[TEST 6] Verifying message persistence in Aiven PostgreSQL...');
  const { rows: dbMsg } = await pool.query(
    'SELECT id, conversation_id, sender_id, content, created_at FROM messages WHERE id = $1;',
    [receivedMsg.id]
  );
  console.log('PostgreSQL Record:', dbMsg[0]);
  if (!dbMsg.length || dbMsg[0].content !== testMsgContent) {
    throw new Error('Message was not found in Aiven PostgreSQL!');
  }
  console.log('✓ Message verified stored in Aiven PostgreSQL with id:', dbMsg[0].id);

  // Step 7: Client B disconnects -> Client A receives user_status_changed offline
  console.log('\n[TEST 7] Testing presence change on disconnect...');
  const offlinePromise = new Promise((resolve) => {
    clientA.on('user_status_changed', (status) => {
      if (status.userId === 'user_2' && status.is_online === false) {
        resolve(status);
      }
    });
  });

  clientB.disconnect();
  const statusEvent = await offlinePromise;
  console.log('✓ Client A received offline event for User 2:', statusEvent);

  // Check database for offline status
  await new Promise(r => setTimeout(r, 200));
  const { rows: offCheck } = await pool.query(
    'SELECT id, is_online, last_seen FROM users WHERE id = \'user_2\';'
  );
  console.log('PostgreSQL User 2 Presence:', offCheck[0]);
  if (offCheck[0].is_online) throw new Error('User 2 should be marked offline in PostgreSQL');
  console.log('✓ User 2 successfully marked offline in Aiven PostgreSQL!');

  clientA.disconnect();
  await pool.end();
  console.log('\n=== ALL 7 REAL-TIME TESTS PASSED SUCCESSFULLY! ===');
  process.exit(0);
}

testRealtimeFlow().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});

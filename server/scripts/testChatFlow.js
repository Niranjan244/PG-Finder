import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { io } = require('../../client/node_modules/socket.io-client');

const BASE_URL = 'http://localhost:5000';

async function loginUser(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const cookieHeader = res.headers.get('set-cookie') || '';
  const tokenMatch = cookieHeader.match(/token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;

  const data = await res.json();
  if (!data.success) {
    throw new Error(`Login failed for ${email}: ${data.message}`);
  }

  return { user: data.data.user, token };
}

async function runChatVerification() {
  console.log('--- Starting Phase 6 Real-Time Chat Verification ---');

  // 1. Authenticate Tenant and Owner
  console.log('1. Authenticating test users...');
  const tenantAuth = await loginUser('nana123@gmail.com', 'Password123');
  const ownerAuth = await loginUser('nani123@gmail.com', 'Password123');
  const thirdUserAuth = await loginUser('venkat.sai785@gmail.com', 'Password123');

  console.log(`   Tenant logged in: ${tenantAuth.user.name} (${tenantAuth.user._id})`);
  console.log(`   Owner logged in: ${ownerAuth.user.name} (${ownerAuth.user._id})`);
  console.log(`   Third party logged in: ${thirdUserAuth.user.name} (${thirdUserAuth.user._id})`);

  // 2. Start Conversation via REST API
  console.log('2. Initiating conversation between tenant and owner via REST API...');
  const startConvRes = await fetch(`${BASE_URL}/api/chat/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `token=${tenantAuth.token}`,
    },
    body: JSON.stringify({
      pgId: '6ad22ad6d5014b46787b81d8',
      ownerId: ownerAuth.user._id,
    }),
  });

  const convData = await startConvRes.json();
  if (!convData.success) {
    throw new Error(`Failed to start conversation: ${convData.message}`);
  }

  const conversationId = convData.data.conversation._id;
  console.log(`   Conversation established: ${conversationId}`);

  // 3. Connect Sockets with Handshake Auth
  console.log('3. Connecting Socket.IO clients for Tenant, Owner, and Third-Party...');
  const tenantSocket = io(BASE_URL, {
    auth: { token: tenantAuth.token },
    transports: ['websocket'],
  });

  const ownerSocket = io(BASE_URL, {
    auth: { token: ownerAuth.token },
    transports: ['websocket'],
  });

  const thirdUserSocket = io(BASE_URL, {
    auth: { token: thirdUserAuth.token },
    transports: ['websocket'],
  });

  await Promise.all([
    new Promise((resolve) => tenantSocket.on('connect', resolve)),
    new Promise((resolve) => ownerSocket.on('connect', resolve)),
    new Promise((resolve) => thirdUserSocket.on('connect', resolve)),
  ]);

  console.log('   All 3 socket connections authenticated successfully.');

  // 4. Test Participant Authorization & Isolation
  console.log('4. Testing conversation room authorization...');
  const thirdPartyJoinResult = await new Promise((resolve) => {
    thirdUserSocket.emit('join_conversation', { conversationId }, (res) => resolve(res));
  });

  if (thirdPartyJoinResult?.success === false) {
    console.log(`   Isolation Guard PASSED: Unauthorized user rejected with: "${thirdPartyJoinResult.message}"`);
  } else {
    throw new Error('Isolation Guard FAILED: Unauthorized user was allowed into the room!');
  }

  // Join legitimate participants
  const tenantJoin = await new Promise((resolve) => {
    tenantSocket.emit('join_conversation', { conversationId }, (res) => resolve(res));
  });
  const ownerJoin = await new Promise((resolve) => {
    ownerSocket.emit('join_conversation', { conversationId }, (res) => resolve(res));
  });

  console.log(`   Tenant joined room: ${tenantJoin.roomName}`);
  console.log(`   Owner joined room: ${ownerJoin.roomName}`);

  // 5. Test Typing Indicators
  console.log('5. Testing typing indicators...');
  const typingPromise = new Promise((resolve) => {
    ownerSocket.on('user_typing', (data) => {
      if (data.conversationId === conversationId) {
        console.log(`   Owner received typing event from: ${data.userName}`);
        resolve(data);
      }
    });
  });

  tenantSocket.emit('typing_start', { conversationId });
  await typingPromise;

  tenantSocket.emit('typing_stop', { conversationId });

  // 6. Test Real-time Message Dispatch (Tenant -> Owner)
  console.log('6. Tenant sending real-time message to Owner...');
  const tenantMessageText = 'Hello owner! Is Room 101 vacant for immediate move-in?';

  const ownerReceivePromise = new Promise((resolve) => {
    ownerSocket.on('new_message', (data) => {
      if (data.conversationId === conversationId && data.message.text === tenantMessageText) {
        console.log(`   Owner received real-time new_message: "${data.message.text}"`);
        resolve(data);
      }
    });
  });

  const sendResult1 = await new Promise((resolve) => {
    tenantSocket.emit('send_message', { conversationId, text: tenantMessageText }, (res) => resolve(res));
  });

  if (!sendResult1?.success) {
    throw new Error(`Failed to send message: ${sendResult1?.message || sendResult1?.error}`);
  }

  await ownerReceivePromise;

  // 7. Test Real-time Message Reply (Owner -> Tenant)
  console.log('7. Owner sending reply to Tenant...');
  const ownerReplyText = 'Yes, Room 101 is available and fully furnished!';

  const tenantReceivePromise = new Promise((resolve) => {
    tenantSocket.on('new_message', (data) => {
      if (data.conversationId === conversationId && data.message.text === ownerReplyText) {
        console.log(`   Tenant received real-time reply: "${data.message.text}"`);
        resolve(data);
      }
    });
  });

  const sendResult2 = await new Promise((resolve) => {
    ownerSocket.emit('send_message', { conversationId, text: ownerReplyText }, (res) => resolve(res));
  });

  if (!sendResult2?.success) {
    throw new Error(`Failed to send owner reply: ${sendResult2?.message || sendResult2?.error}`);
  }

  await tenantReceivePromise;

  // 8. Test Read Receipts
  console.log('8. Testing read receipt synchronization...');
  const readReceiptPromise = new Promise((resolve) => {
    tenantSocket.on('messages_read', (data) => {
      if (data.conversationId === conversationId) {
        console.log(`   Tenant received read receipt: messages read by ${data.readBy}`);
        resolve(data);
      }
    });
  });

  ownerSocket.emit('mark_read', { conversationId });
  await readReceiptPromise;

  // 9. Verify MongoDB Persistence via REST API
  console.log('9. Verifying message persistence via REST API...');
  const messagesRes = await fetch(`${BASE_URL}/api/chat/conversations/${conversationId}/messages`, {
    headers: {
      Cookie: `token=${tenantAuth.token}`,
    },
  });

  const messagesData = await messagesRes.json();
  if (!messagesData.success) {
    throw new Error(`Failed to fetch conversation messages: ${messagesData.message}`);
  }

  const storedMessages = messagesData.data.messages;
  console.log(`   Total persisted messages in DB thread: ${storedMessages.length}`);
  storedMessages.forEach((m, idx) => {
    console.log(`     [Msg ${idx + 1}] (${m.sender?.name || m.sender}): ${m.text}`);
  });

  // 10. Clean up
  tenantSocket.disconnect();
  ownerSocket.disconnect();
  thirdUserSocket.disconnect();

  console.log('\n--- Phase 6 Real-Time Chat Verification COMPLETED SUCCESSFULLY ---');
  process.exit(0);
}

runChatVerification().catch((err) => {
  console.error('\nVerification FAILED:', err);
  process.exit(1);
});

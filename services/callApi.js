import { isSupabaseConfigured } from './supabaseConfig.js';
import { remoteDelete, remoteInsert, remoteRpc, remoteSelect, remoteUpdate } from './supabaseClient.js';

function requireSupabase() {
  if (!isSupabaseConfigured) throw new Error('Audio and video calls require the connected Supabase project.');
}

const mapCall = row => ({
  id: row.id,
  conversationId: row.conversation_id,
  callerId: row.caller_id,
  calleeId: row.callee_id,
  isVideo: row.is_video,
  status: row.status,
  createdAt: row.created_at
});

export async function startCall(userId, conversationId, calleeId, isVideo) {
  requireSupabase();
  const [row] = await remoteInsert('call_sessions', {
    conversation_id: conversationId,
    caller_id: userId,
    callee_id: calleeId,
    is_video: isVideo,
    status: 'ringing'
  });
  return mapCall(row);
}

export async function listIncomingCalls(userId) {
  requireSupabase();
  return (await remoteSelect('call_sessions',
    `select=*&callee_id=eq.${encodeURIComponent(userId)}&status=eq.ringing&order=created_at.desc&limit=1`))
    .map(mapCall);
}

export async function listRingingCalls(userId) {
  requireSupabase();
  return (await remoteSelect('call_sessions',
    `select=*&or=(caller_id.eq.${encodeURIComponent(userId)},callee_id.eq.${encodeURIComponent(userId)})&status=eq.ringing&order=created_at.asc&limit=10`))
    .map(mapCall);
}

export async function listCallHistory(userId) {
  requireSupabase();
  const [calls, hidden] = await Promise.all([
    remoteSelect('call_sessions',
      `select=*&or=(caller_id.eq.${encodeURIComponent(userId)},callee_id.eq.${encodeURIComponent(userId)})&status=in.(rejected,ended,missed)&order=created_at.desc`),
    remoteSelect('call_history_hidden', `select=call_id&user_id=eq.${encodeURIComponent(userId)}`)
  ]);
  const hiddenCallIds = new Set(hidden.map(row => row.call_id));
  return calls.filter(call => !hiddenCallIds.has(call.id)).map(mapCall);
}

export async function hideCallHistory(userId, callId) {
  requireSupabase();
  if (!callId) throw new Error('Choose a call to remove from your history.');
  await remoteInsert('call_history_hidden', { call_id: callId, user_id: userId });
}

export async function clearCallHistory() {
  requireSupabase();
  return remoteRpc('hide_my_call_history', {});
}

export async function getCall(callId) {
  requireSupabase();
  const [row] = await remoteSelect('call_sessions',
    `select=*&id=eq.${encodeURIComponent(callId)}&limit=1`);
  return row ? mapCall(row) : null;
}

export async function respondToCall(userId, callId, status) {
  requireSupabase();
  if (!['accepted', 'rejected', 'ended'].includes(status)) throw new Error('Invalid call status.');
  const query = status === 'ended'
    ? `id=eq.${encodeURIComponent(callId)}&status=in.(ringing,accepted)`
    : `id=eq.${encodeURIComponent(callId)}&callee_id=eq.${encodeURIComponent(userId)}&status=eq.ringing`;
  const [row] = await remoteUpdate('call_sessions', query, { status });
  if (!row) throw new Error('This call is no longer available.');
  return mapCall(row);
}

export async function markCallMissed(userId, callId) {
  requireSupabase();
  const [row] = await remoteUpdate('call_sessions',
    `id=eq.${encodeURIComponent(callId)}&or=(caller_id.eq.${encodeURIComponent(userId)},callee_id.eq.${encodeURIComponent(userId)})&status=eq.ringing`,
    { status: 'missed' });
  return row ? mapCall(row) : null;
}

export async function sendCallSignal(userId, callId, targetId, eventType, payload) {
  requireSupabase();
  if (!['offer', 'answer', 'ice-candidate'].includes(eventType)) throw new Error('Invalid call signal.');
  const [row] = await remoteInsert('call_signals', {
    call_id: callId,
    sender_id: userId,
    target_id: targetId,
    event_type: eventType,
    payload
  });
  return row;
}

export async function listCallSignals(userId, callId) {
  requireSupabase();
  return remoteSelect('call_signals',
    `select=*&call_id=eq.${encodeURIComponent(callId)}&target_id=eq.${encodeURIComponent(userId)}&order=created_at.asc`);
}

export async function clearCallSignals(callId) {
  requireSupabase();
  await remoteDelete('call_signals', `call_id=eq.${encodeURIComponent(callId)}`);
}

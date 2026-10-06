import { makeId, readStore, scopedKey, writeStore } from './storage.js';
import { isSupabaseConfigured } from './supabaseConfig.js';
import { remoteInsert, remoteSelect } from './supabaseClient.js';
const key = userId => scopedKey(userId, 'messages');
export async function listMessages(userId) {
  if (isSupabaseConfigured) return (await remoteSelect('messages', `select=*&user_id=eq.${encodeURIComponent(userId)}&order=created_at.asc`)).map(row => ({ ...row, senderId: row.user_id, createdAt: row.created_at }));
  return readStore(key(userId), []);
}
export async function createMessage(userId, input) {
  if (isSupabaseConfigured) {
    const [row] = await remoteInsert('messages', { user_id: userId, text: input.text });
    return { ...row, senderId: row.user_id, createdAt: row.created_at };
  }
  const message = { id: makeId(), ...input, senderId: userId, createdAt: new Date().toISOString() };
  writeStore(key(userId), [...readStore(key(userId), []), message]);
  return message;
}

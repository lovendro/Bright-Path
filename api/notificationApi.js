import { makeId, readStore, scopedKey, writeStore } from './storage.js';
import { isSupabaseConfigured } from './supabaseConfig.js';
import { remoteInsert, remoteSelect, remoteUpdate } from './supabaseClient.js';
const key = userId => scopedKey(userId, 'notifications');
export async function listNotifications(userId) {
  if (isSupabaseConfigured) return (await remoteSelect('notifications', `select=*&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc`)).map(row => ({ ...row, createdAt: row.created_at }));
  return readStore(key(userId), []);
}
export async function addNotification(userId, input) {
  if (isSupabaseConfigured) {
    const [row] = await remoteInsert('notifications', { user_id: userId, title: input.title, message: input.message });
    return { ...row, createdAt: row.created_at };
  }
  const notification = { id: makeId(), ...input, read: false, createdAt: new Date().toISOString() };
  writeStore(key(userId), [notification, ...listNotifications(userId)]);
  return notification;
}
export async function markNotificationsRead(userId) {
  if (isSupabaseConfigured) return remoteUpdate('notifications', `user_id=eq.${encodeURIComponent(userId)}&read=eq.false`, { read: true });
  writeStore(key(userId), readStore(key(userId), []).map(item => ({ ...item, read: true })));
}

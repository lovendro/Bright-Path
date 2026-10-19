import { makeId, readStore, scopedKey, writeStore } from './storage.js';
import { isSupabaseConfigured } from './supabaseConfig.js';
import { remoteDelete, remoteInsert, remoteSelect, remoteUpdate } from './supabaseClient.js';
const key = userId => scopedKey(userId, 'notifications');
const READ_NOTIFICATION_RETENTION_MS = 48 * 60 * 60 * 1000;

async function removeExpiredReadNotifications(userId) {
  const cutoff = new Date(Date.now() - READ_NOTIFICATION_RETENTION_MS).toISOString();
  if (isSupabaseConfigured) {
    await remoteDelete('notifications', `user_id=eq.${encodeURIComponent(userId)}&read=eq.true&read_at=lt.${encodeURIComponent(cutoff)}`);
    return;
  }
  const notifications = readStore(key(userId), []);
  const remaining = notifications.filter(item => {
    if (!item.read) return true;
    const readAt = Date.parse(item.readAt || item.createdAt);
    return !Number.isFinite(readAt) || readAt >= Date.parse(cutoff);
  });
  if (remaining.length !== notifications.length) writeStore(key(userId), remaining);
}

export async function listNotifications(userId) {
  await removeExpiredReadNotifications(userId);
  if (isSupabaseConfigured) return (await remoteSelect('notifications', `select=*&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc`)).map(row => ({ ...row, read: row.read ?? false, createdAt: row.created_at, readAt: row.read_at }));
  return readStore(key(userId), []);
}

export async function getUnreadNotificationCount(userId) {
  await removeExpiredReadNotifications(userId);
  if (isSupabaseConfigured) {
    return (await remoteSelect('notifications', `select=id&user_id=eq.${encodeURIComponent(userId)}&read=eq.false`)).length;
  }
  return readStore(key(userId), []).filter(item => !item.read).length;
}
export async function addNotification(userId, input) {
  if (isSupabaseConfigured) {
    const [row] = await remoteInsert('notifications', { user_id: userId, title: input.title, message: input.message });
    return { ...row, createdAt: row.created_at };
  }
  const notification = { id: makeId(), ...input, read: false, createdAt: new Date().toISOString() };
  const notifications = await listNotifications(userId);
  writeStore(key(userId), [notification, ...notifications]);
  return notification;
}
export async function markNotificationsRead(userId) {
  const readAt = new Date().toISOString();
  if (isSupabaseConfigured) return remoteUpdate('notifications', `user_id=eq.${encodeURIComponent(userId)}&read=eq.false`, { read: true, read_at: readAt });
  writeStore(key(userId), readStore(key(userId), []).map(item => ({ ...item, read: true, readAt })));
}

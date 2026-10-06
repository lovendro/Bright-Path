import { makeId, readStore, scopedKey, writeStore } from './storage.js';
import { isSupabaseConfigured } from './supabaseConfig.js';
import { remoteDelete, remoteInsert, remoteSelect } from './supabaseClient.js';
const key = 'resources';
const fromRemote = row => ({ ...row, ownerId: row.owner_id, authorName: row.author_name, createdAt: row.created_at });
export async function listResources() {
  if (isSupabaseConfigured) return (await remoteSelect('resources', 'select=*&order=created_at.desc')).map(fromRemote);
  return readStore(key, []);
}
export async function createResource(userId, input) {
  if (isSupabaseConfigured) {
    const [row] = await remoteInsert('resources', {
      title: input.title, description: input.description, subject: input.subject,
      type: input.type, level: input.level, author_id: userId, author_name: input.authorName
    });
    return fromRemote(row);
  }
  const item = { id: makeId(), ...input, ownerId: userId, createdAt: new Date().toISOString(), likes: 0 };
  writeStore(key, [item, ...readStore(key, [])]);
  return item;
}
export async function deleteResource(userId, id) {
  if (isSupabaseConfigured) return remoteDelete('resources', `id=eq.${encodeURIComponent(id)}&owner_id=eq.${encodeURIComponent(userId)}`);
  writeStore(key, readStore(key, []).filter(item => item.id !== id || item.ownerId !== userId));
}
export async function toggleSavedResource(userId, id) {
  const savedKey = scopedKey(userId, 'saved-resources');
  if (isSupabaseConfigured) {
    const existing = await remoteSelect('saved_resources', `select=resource_id&user_id=eq.${encodeURIComponent(userId)}&resource_id=eq.${encodeURIComponent(id)}`);
    if (existing.length) {
      await remoteDelete('saved_resources', `user_id=eq.${encodeURIComponent(userId)}&resource_id=eq.${encodeURIComponent(id)}`);
      return false;
    }
    await remoteInsert('saved_resources', { user_id: userId, resource_id: id });
    return true;
  }
  const ids = readStore(savedKey, []);
  const updated = ids.includes(id) ? ids.filter(savedId => savedId !== id) : [...ids, id];
  writeStore(savedKey, updated);
  return updated.includes(id);
}
export async function savedResourceIds(userId) {
  if (isSupabaseConfigured) {
    const rows = await remoteSelect('saved_resources', `select=resource_id&user_id=eq.${encodeURIComponent(userId)}`);
    return rows.map(row => row.resource_id);
  }
  return readStore(scopedKey(userId, 'saved-resources'), []);
}

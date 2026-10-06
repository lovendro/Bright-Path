import { currentUser } from './authApi.js';
import { readStore, scopedKey, writeStore } from './storage.js';
import { isSupabaseConfigured } from './supabaseConfig.js';
import { remoteSelect, remoteUpdate } from './supabaseClient.js';
export async function getProfile(userId) {
  const user = currentUser();
  if (!user || user.id !== userId) return null;
  if (isSupabaseConfigured) {
    const [profile] = await remoteSelect('profiles', `select=*&id=eq.${encodeURIComponent(userId)}&limit=1`);
    return profile ? { ...user, bio: profile.bio || '', interests: profile.interests || '', level: profile.level || user.level } : user;
  }
  return { ...user, ...readStore(scopedKey(userId, 'profile'), {}) };
}
export async function updateProfile(userId, changes) {
  const allowed = { bio: String(changes.bio || ''), interests: String(changes.interests || ''), level: String(changes.level || '') };
  if (isSupabaseConfigured) {
    const [profile] = await remoteUpdate('profiles', `id=eq.${encodeURIComponent(userId)}`, allowed);
    return profile ? { ...currentUser(), ...profile } : getProfile(userId);
  }
  writeStore(scopedKey(userId, 'profile'), allowed);
  return getProfile(userId);
}

import { currentUser } from './authApi.js';
import { readStore, scopedKey, writeStore } from './storage.js';
import { isSupabaseConfigured } from './supabaseConfig.js';
import { remoteSelect, remoteUpdate } from './supabaseClient.js';
export async function getProfile(userId) {
  const user = currentUser();
  if (!user || user.id !== userId) return null;
  if (isSupabaseConfigured) {
    const [profile] = await remoteSelect('profiles', `select=*&id=eq.${encodeURIComponent(userId)}&limit=1`);
    return profile ? {
      ...user,
      bio: profile.bio || '',
      interests: profile.interests || '',
      level: profile.level || user.level,
      isPublic: profile.is_public ?? false,
      theme: profile.theme || 'system'
    } : { ...user, isPublic: false, theme: 'system' };
  }
  return { ...user, isPublic: false, theme: 'system', ...readStore(scopedKey(userId, 'profile'), {}) };
}
export async function updateProfile(userId, changes) {
  const allowed = {};
  if ('bio' in changes) allowed.bio = String(changes.bio || '');
  if ('interests' in changes) allowed.interests = String(changes.interests || '');
  if ('level' in changes) allowed.level = String(changes.level || '');
  if ('isPublic' in changes) allowed.is_public = Boolean(changes.isPublic);
  if ('theme' in changes) allowed.theme = ['light', 'dark', 'system'].includes(changes.theme) ? changes.theme : 'system';
  if (!Object.keys(allowed).length) return getProfile(userId);
  if (isSupabaseConfigured) {
    const [profile] = await remoteUpdate('profiles', `id=eq.${encodeURIComponent(userId)}`, allowed);
    return profile ? {
      ...currentUser(),
      ...profile,
      isPublic: profile.is_public,
      theme: profile.theme
    } : getProfile(userId);
  }
  const existing = readStore(scopedKey(userId, 'profile'), {});
  writeStore(scopedKey(userId, 'profile'), {
    ...existing,
    ...allowed,
    ...('is_public' in allowed ? { isPublic: allowed.is_public } : {})
  });
  return getProfile(userId);
}

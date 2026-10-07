import { currentUser } from './authApi.js';
import { readStore, scopedKey, writeStore } from './storage.js';
import { isSupabaseConfigured, SUPABASE_URL } from './supabaseConfig.js';
import { remoteStorageRequest, remoteSelect, remoteUpdate } from './supabaseClient.js';

const PROFILE_PHOTO_BUCKET = 'profile-photos';
const MAX_PROFILE_PHOTO_SIZE = 5 * 1024 * 1024;
const PROFILE_PHOTO_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp']
]);
const encodeStoragePath = path => path.split('/').map(encodeURIComponent).join('/');

async function profilePhotoUrl(path) {
  const result = await remoteStorageRequest(
    `object/sign/${PROFILE_PHOTO_BUCKET}/${encodeStoragePath(path)}`,
    { method: 'POST', contentType: 'application/json', body: JSON.stringify({ expiresIn: 3600 }) }
  );
  if (!result?.signedURL) throw new Error('Could not load the profile picture.');
  if (/^https?:\/\//i.test(result.signedURL)) return result.signedURL;
  const signedPath = result.signedURL.startsWith('/storage/v1/')
    ? result.signedURL
    : `/storage/v1/${result.signedURL.replace(/^\/+/, '')}`;
  return new URL(signedPath, SUPABASE_URL).href;
}

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
      avatar_path: profile.avatar_path || null,
      avatarUrl: profile.avatar_path ? await profilePhotoUrl(profile.avatar_path) : '',
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

export async function updateProfilePicture(userId, file) {
  const extension = PROFILE_PHOTO_TYPES.get(file?.type);
  if (!extension) throw new Error('Choose a JPG, PNG, or WebP profile picture.');
  if (file.size > MAX_PROFILE_PHOTO_SIZE) throw new Error('Profile pictures must be 5 MB or smaller.');
  if (!isSupabaseConfigured) throw new Error('Profile picture uploads require the connected Supabase project.');

  const existing = await getProfile(userId);
  const previousPath = existing?.avatar_path || '';
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  await remoteStorageRequest(`object/${PROFILE_PHOTO_BUCKET}/${encodeStoragePath(path)}`, {
    method: 'POST',
    contentType: file.type,
    body: file
  });

  let updated;
  try {
    [updated] = await remoteUpdate('profiles', `id=eq.${encodeURIComponent(userId)}`, { avatar_path: path });
    if (!updated) throw new Error('The profile was not updated. Please try again.');
  } catch (error) {
    try {
      await remoteStorageRequest(`object/${PROFILE_PHOTO_BUCKET}/${encodeStoragePath(path)}`, { method: 'DELETE' });
    } catch (cleanupError) {
      throw new Error(`${error.message} The uploaded picture could not be cleaned up: ${cleanupError.message}`);
    }
    throw error;
  }

  if (previousPath) {
    try {
      await remoteStorageRequest(`object/${PROFILE_PHOTO_BUCKET}/${encodeStoragePath(previousPath)}`, { method: 'DELETE' });
    } catch (error) {
      throw new Error(`Your profile picture was saved, but the previous picture could not be removed: ${error.message}`);
    }
  }
  return { ...updated, avatarUrl: await profilePhotoUrl(path) };
}

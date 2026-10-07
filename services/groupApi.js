import { makeId, readStore, scopedKey, writeStore } from './storage.js';
import { isSupabaseConfigured, SUPABASE_URL } from './supabaseConfig.js';
import { remoteInsert, remoteSelect, remoteStorageRequest } from './supabaseClient.js';
const key = 'groups';
const fromRemote = row => ({
  ...row, ownerId: row.owner_id, authorName: row.author_name, createdAt: row.created_at,
  memberIds: (row.group_members || []).map(member => member.user_id)
});
export async function listGroups() {
  if (isSupabaseConfigured) return (await remoteSelect('study_groups', 'select=*,group_members(user_id)&order=created_at.desc')).map(fromRemote);
  return readStore(key, []);
}
export async function createGroup(userId, input) {
  if (isSupabaseConfigured) {
    const [row] = await remoteInsert('study_groups', {
      name: input.name || input.title, description: input.description, subject: input.subject,
      owner_id: userId, author_name: input.authorName
    });
    return { ...fromRemote(row), memberIds: [userId] };
  }
  const group = { id: makeId(), ...input, ownerId: userId, memberIds: [userId], createdAt: new Date().toISOString() };
  writeStore(key, [group, ...readStore(key, [])]);
  return group;
}
export async function joinGroup(userId, groupId) {
  if (isSupabaseConfigured) {
    await remoteInsert('group_members', { group_id: groupId, user_id: userId }, { query: 'on_conflict=group_id,user_id&select=*', ignoreDuplicates: true });
    return;
  }
  const groups = readStore(key, []).map(group => group.id === groupId
    ? { ...group, memberIds: group.memberIds.includes(userId) ? group.memberIds : [...group.memberIds, userId] }
    : group);
  writeStore(key, groups);
}

const IMAGE_EXTENSIONS = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp']
]);
const MAX_GROUP_IMAGE_SIZE = 5 * 1024 * 1024;
const encodeStoragePath = path => path.split('/').map(encodeURIComponent).join('/');

async function signedGroupImage(path) {
  const result = await remoteStorageRequest(
    `object/sign/group-chat/${encodeStoragePath(path)}`,
    { method: 'POST', contentType: 'application/json', body: JSON.stringify({ expiresIn: 3600 }) }
  );
  if (!result?.signedURL) throw new Error('Could not load the group image.');
  if (/^https?:\/\//i.test(result.signedURL)) return result.signedURL;
  const signedPath = result.signedURL.startsWith('/storage/v1/')
    ? result.signedURL
    : `/storage/v1/${result.signedURL.replace(/^\/+/, '')}`;
  return new URL(signedPath, SUPABASE_URL).href;
}

export async function listGroupMessages(groupId, after = '') {
  if (!isSupabaseConfigured) {
    const messages = readStore(scopedKey(groupId, 'group-messages'), []);
    return after ? messages.filter(message => message.createdAt > after) : messages;
  }
  const rows = await remoteSelect('group_messages',
    `select=*&group_id=eq.${encodeURIComponent(groupId)}${after ? `&created_at=gt.${encodeURIComponent(after)}` : ''}&order=created_at.asc`);
  return Promise.all(rows.map(async row => ({
    id: row.id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    text: row.body,
    imageUrl: row.image_path ? await signedGroupImage(row.image_path) : '',
    createdAt: row.created_at
  })));
}

export async function sendGroupMessage(userId, groupId, input) {
  const body = String(input.text || '').trim();
  const image = input.image;
  if (!body && !image) throw new Error('Write a message or attach a picture.');
  if (body.length > 2000) throw new Error('Messages must be 2,000 characters or fewer.');
  let imagePath = '';

  if (image) {
    const extension = IMAGE_EXTENSIONS.get(image.type);
    if (!extension) throw new Error('Choose a JPG, PNG, or WebP image.');
    if (image.size > MAX_GROUP_IMAGE_SIZE) throw new Error('Images must be 5 MB or smaller.');
    if (!isSupabaseConfigured) throw new Error('Image sharing requires the connected Supabase project.');
    imagePath = `${groupId}/${crypto.randomUUID()}.${extension}`;
    await remoteStorageRequest(
      `object/group-chat/${encodeStoragePath(imagePath)}`,
      { method: 'POST', contentType: image.type, body: image }
    );
  }

  if (isSupabaseConfigured) {
    let row;
    try {
      [row] = await remoteInsert('group_messages', {
        group_id: groupId,
        sender_id: userId,
        sender_name: input.senderName,
        body,
        image_path: imagePath || null
      });
    } catch (error) {
      if (imagePath) {
        try {
          await remoteStorageRequest(`object/group-chat/${encodeStoragePath(imagePath)}`, { method: 'DELETE' });
        } catch (cleanupError) {
          throw new Error(`${error.message} The uploaded image could not be cleaned up: ${cleanupError.message}`);
        }
      }
      throw error;
    }
    return {
      id: row.id,
      senderId: row.sender_id,
      senderName: row.sender_name,
      text: row.body,
      imageUrl: imagePath ? await signedGroupImage(imagePath) : '',
      createdAt: row.created_at
    };
  }

  const messagesKey = scopedKey(groupId, 'group-messages');
  const message = { id: makeId(), senderId: userId, senderName: input.senderName, text: body, imageUrl: '', createdAt: new Date().toISOString() };
  writeStore(messagesKey, [...readStore(messagesKey, []), message]);
  return message;
}

import { makeId, readStore, writeStore } from './storage.js';
import { isSupabaseConfigured } from './supabaseConfig.js';
import { remoteInsert, remoteSelect } from './supabaseClient.js';
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

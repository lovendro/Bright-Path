import { makeId, readStore, writeStore } from './storage.js';
import { isSupabaseConfigured } from './supabaseConfig.js';
import { remoteInsert, remoteSelect } from './supabaseClient.js';
const key = 'discussions';
const fromRemote = row => ({ ...row, authorId: row.author_id, authorName: row.author_name, replyCount: row.reply_count, createdAt: row.created_at });
export async function listDiscussions() {
  if (isSupabaseConfigured) return (await remoteSelect('discussions', 'select=*&order=created_at.desc')).map(fromRemote);
  return readStore(key, []);
}
export async function createDiscussion(userId, input) {
  if (isSupabaseConfigured) {
    const [row] = await remoteInsert('discussions', {
      title: input.title, description: input.description, author_id: userId, author_name: input.authorName
    });
    return fromRemote(row);
  }
  const discussion = { id: makeId(), ...input, authorId: userId, replyCount: 0, createdAt: new Date().toISOString() };
  writeStore(key, [discussion, ...readStore(key, [])]);
  return discussion;
}

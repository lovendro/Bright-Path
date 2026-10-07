import { makeId, readStore, writeStore } from './storage.js';
import { isSupabaseConfigured } from './supabaseConfig.js';
import { remoteInsert, remoteSelect } from './supabaseClient.js';
import { deleteCommunityAttachments, resolveCommunityAttachments, uploadCommunityAttachments } from './communityAttachmentApi.js';
const key = 'discussions';
const fromRemote = row => ({ ...row, authorId: row.author_id, authorName: row.author_name, replyCount: row.reply_count, createdAt: row.created_at });
export async function listDiscussions() {
  if (isSupabaseConfigured) return Promise.all((await remoteSelect('discussions', 'select=*&order=created_at.desc'))
    .map(async row => ({ ...fromRemote(row), attachments: await resolveCommunityAttachments(row.attachments || []) })));
  return readStore(key, []);
}
export async function createDiscussion(userId, input) {
  if (isSupabaseConfigured) {
    const attachments = await uploadCommunityAttachments(userId, 'discussions', input.files);
    let row;
    try {
      [row] = await remoteInsert('discussions', {
        title: input.title, description: input.description, author_id: userId, author_name: input.authorName,
        attachments
      });
    } catch (error) {
      try {
        await deleteCommunityAttachments(attachments);
      } catch (cleanupError) {
        throw new Error(`${error.message} The uploaded attachments could not be cleaned up: ${cleanupError.message}`);
      }
      throw error;
    }
    return { ...fromRemote(row), attachments: await resolveCommunityAttachments(row.attachments || []) };
  }
  if (input.files?.length) throw new Error('File uploads require the connected Supabase project.');
  const discussion = { id: makeId(), ...input, authorId: userId, replyCount: 0, createdAt: new Date().toISOString() };
  writeStore(key, [discussion, ...readStore(key, [])]);
  return discussion;
}

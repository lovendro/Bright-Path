import { isSupabaseConfigured, SUPABASE_URL } from './supabaseConfig.js';
import { remoteStorageRequest } from './supabaseClient.js';

const BUCKET = 'community-uploads';
const MAX_FILES = 5;
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MAX_TOTAL_SIZE = 25 * 1024 * 1024;
const FILE_TYPES = new Map([
  ['jpg', { mime: 'image/jpeg', image: true }],
  ['jpeg', { mime: 'image/jpeg', image: true }],
  ['png', { mime: 'image/png', image: true }],
  ['webp', { mime: 'image/webp', image: true }],
  ['pdf', { mime: 'application/pdf' }],
  ['doc', { mime: 'application/msword' }],
  ['docx', { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }],
  ['ppt', { mime: 'application/vnd.ms-powerpoint' }],
  ['pptx', { mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }],
  ['xls', { mime: 'application/vnd.ms-excel' }],
  ['xlsx', { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }]
]);

const encodeStoragePath = path => path.split('/').map(encodeURIComponent).join('/');

function validatedFiles(files) {
  const selected = Array.from(files || []).filter(file => file?.size > 0);
  if (!selected.length) return [];
  if (selected.length > MAX_FILES) throw new Error(`Attach up to ${MAX_FILES} files at a time.`);

  const totalSize = selected.reduce((total, file) => total + file.size, 0);
  if (totalSize > MAX_TOTAL_SIZE) throw new Error('Attachments must total 25 MB or less.');

  return selected.map(file => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const type = FILE_TYPES.get(extension);
    if (!type || (file.type && file.type !== type.mime)) {
      throw new Error(`“${file.name}” is not a supported image or document. Use JPG, PNG, WebP, PDF, Word, PowerPoint, or Excel files.`);
    }
    if (file.size > MAX_FILE_SIZE) throw new Error(`“${file.name}” is larger than the 15 MB per-file limit.`);
    return { file, extension, ...type };
  });
}

export async function deleteCommunityAttachments(attachments) {
  for (const attachment of attachments) {
    await remoteStorageRequest(`object/${BUCKET}/${encodeStoragePath(attachment.path)}`, { method: 'DELETE' });
  }
}

export async function uploadCommunityAttachments(userId, kind, files) {
  const selected = validatedFiles(files);
  if (!selected.length) return [];
  if (!isSupabaseConfigured) throw new Error('File uploads require the connected Supabase project.');
  if (!['resources', 'discussions'].includes(kind)) throw new Error('Unsupported attachment destination.');

  const uploaded = [];
  try {
    for (const { file, extension, mime, image } of selected) {
      const path = `${userId}/${kind}/${crypto.randomUUID()}.${extension}`;
      await remoteStorageRequest(`object/${BUCKET}/${encodeStoragePath(path)}`, {
        method: 'POST',
        contentType: mime,
        body: file
      });
      uploaded.push({ name: file.name, path, mime, size: file.size, image });
    }
  } catch (error) {
    try {
      await deleteCommunityAttachments(uploaded);
    } catch (cleanupError) {
      throw new Error(`${error.message} Some uploaded files could not be cleaned up: ${cleanupError.message}`);
    }
    throw error;
  }
  return uploaded;
}

export async function resolveCommunityAttachments(attachments = []) {
  return Promise.all(attachments.map(async attachment => {
    if (!attachment?.path || !attachment?.name) throw new Error('A community attachment record is invalid.');
    const result = await remoteStorageRequest(
      `object/sign/${BUCKET}/${encodeStoragePath(attachment.path)}`,
      { method: 'POST', contentType: 'application/json', body: JSON.stringify({ expiresIn: 3600 }) }
    );
    if (!result?.signedURL) throw new Error(`Could not load attachment “${attachment.name}”.`);
    const signedPath = result.signedURL.startsWith('/storage/v1/')
      ? result.signedURL
      : `/storage/v1/${result.signedURL.replace(/^\/+/, '')}`;
    const signedUrl = /^https?:\/\//i.test(result.signedURL)
      ? result.signedURL
      : new URL(signedPath, SUPABASE_URL).href;
    return { ...attachment, image: attachment.image === true || attachment.mime?.startsWith('image/'), url: signedUrl };
  }));
}

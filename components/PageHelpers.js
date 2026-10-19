import { escapeText, emptyState } from './Navigation.js';
import { icon } from './Icons.js';
import { savedResourceIds } from '../services/resourceApi.js';

export function panel(title, body, action = '') {
  return `<section class="panel"><div class="panel-head"><h2>${escapeText(title)}</h2>${action}</div>${body}</section>`;
}
export async function resourceCards(items, userId) {
  if (!items.length) return emptyState('No resources shared yet', 'Be the first to contribute a study guide, notes, or another useful learning resource.', '<button class="btn btn-sm" data-modal="resource">＋ Share a resource</button>');
  const savedIds = await savedResourceIds(userId);
  return `<div class="resource-grid">${items.map(item => { const isSaved = savedIds.includes(item.id); const type = String(item.type || 'resource').trim().toLowerCase(); const accent = type.includes('past paper') ? 'amber' : type.includes('study guide') ? 'teal' : type.includes('article') ? 'violet' : type.includes('pdf') ? 'coral' : 'blue'; return `<article class="resource-card accent-${accent}"><div class="resource-art"><div class="resource-placeholder">${icon('resources', 24)}</div><span class="filetag">${escapeText(item.type || 'Resource')}</span></div><div class="resource-info"><h3>${escapeText(item.title)}</h3><p>${escapeText(item.subject || 'General')} · ${escapeText(item.level || 'All levels')}</p>${item.description ? `<p class="resource-description">${escapeText(item.description)}</p>` : ''}${attachmentMarkup(item.attachments)}<div class="resource-actions"><span>Shared by ${escapeText(item.authorName || 'a learner')}</span><button class="save-btn" data-save="${escapeText(item.id)}" aria-pressed="${isSaved}">${icon('save', 16)}<span>${isSaved ? 'Saved' : 'Save'}</span></button></div></div></article>`; }).join('')}</div>`;
}
export function groupRows(groups, userId, reviewsByGroup = {}) {
  if (!groups.length) return emptyState('No study groups yet', 'Create the first group and invite learners to work together.', '<button class="btn btn-sm" data-modal="group">＋ Create a group</button>');
  return `<div class="groups-list">${groups.map(group => {
    const joined = group.memberIds?.includes(userId);
    const isOwner = group.ownerId === userId;
    const reviews = reviewsByGroup[group.id] || [];
    const average = reviews.length ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) : '';
    const menuItems = [
      joined
        ? `<button type="button" data-group-chat="${escapeText(group.id)}">Open chat</button><button type="button" data-review-type="group" data-review-target="${escapeText(group.id)}" data-review-name="${escapeText(group.name)}">Reviews</button>`
        : `<button type="button" data-join="${escapeText(group.id)}">Join group</button>`,
      joined && group.isPublic === false
        ? `<button type="button" data-add-group-member="${escapeText(group.id)}" data-group-name="${escapeText(group.name)}">Add member</button>`
        : '',
      isOwner
        ? `<button type="button" data-group-members="${escapeText(group.id)}" data-group-name="${escapeText(group.name)}">Manage members</button><label class="group-visibility-control" for="group-visibility-${escapeText(group.id)}"><span>Visibility</span><select class="field" id="group-visibility-${escapeText(group.id)}" data-group-visibility="${escapeText(group.id)}" aria-label="${escapeText(group.name)} visibility"><option value="public"${group.isPublic !== false ? ' selected' : ''}>Public</option><option value="private"${group.isPublic === false ? ' selected' : ''}>Private</option></select></label>`
        : ''
    ].filter(Boolean).join('');
    return `<article class="group-row accent-teal"><div class="group-avatar" aria-hidden="true">${icon('groups', 21)}</div><div class="group-details"><h3>${escapeText(group.name)}</h3>${group.subject ? `<span class="tag">${escapeText(group.subject)}</span>` : ''}<p>${escapeText(group.description)}</p><span class="group-review-summary">${average ? `${average} ★ · ${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}` : 'No reviews yet'}</span></div><span class="group-count">${group.memberIds?.length || 1} members</span>${joined ? '<span class="joined-tag">Joined</span>' : ''}<div class="group-actions"><button class="group-menu-trigger" type="button" data-group-menu-trigger aria-label="Options for ${escapeText(group.name)}" aria-expanded="false">⋯</button><div class="group-options-menu" data-group-menu hidden>${menuItems}</div></div></article>`;
  }).join('')}</div>`;
}
export function questionRows(questions) {
  if (!questions.length) return emptyState('No questions yet', 'Post a question to get help from learners in the community.', '<button class="btn btn-sm" data-modal="question">＋ Ask a question</button>');
  return `<div class="questions-list">${questions.map(question => `<article class="question-card question-card-compact accent-amber"><div class="question-card-stats"><span><strong>${Number(question.answerCount || 0)}</strong> ${Number(question.answerCount || 0) === 1 ? 'answer' : 'answers'}</span></div><div class="question-card-content"><h3><button class="question-open" type="button" data-open-question="${escapeText(question.id)}">${escapeText(question.title)}</button></h3>${question.description ? `<p class="question-preview">${escapeText(question.description)}</p>` : ''}<div class="question-card-meta">${question.subject ? `<span class="tag">${escapeText(question.subject)}</span>` : ''}<span>Asked by ${escapeText(question.authorName || 'a learner')}</span><time datetime="${escapeText(question.createdAt)}">${escapeText(new Date(question.createdAt).toLocaleDateString())}</time></div></div><div class="vote-box"><button type="button" data-vote="${escapeText(question.id)}" aria-label="Upvote ${escapeText(question.title)}">⌃</button><span>${Number(question.votes || 0)}</span></div></article>`).join('')}</div>`;
}
export function discussionRows(discussions) {
  if (!discussions.length) return emptyState('The forum is ready for its first post', 'Start a conversation, share a study tip, or ask the community what they think.', '<button class="btn btn-sm" data-modal="discussion">＋ Start a discussion</button>');
  return `<div class="discussion-list">${discussions.map(item => `<article class="forum-row discussion-card accent-coral"><div class="question-avatar" aria-hidden="true">${escapeText((item.authorName || '?')[0])}</div><div class="forum-row-content"><h3>${escapeText(item.title)}</h3>${item.description ? `<p class="discussion-preview">${escapeText(item.description)}</p>` : ''}<div class="discussion-meta"><span>${escapeText(item.authorName || 'A learner')}</span><span aria-hidden="true">·</span><time datetime="${escapeText(item.createdAt)}">${escapeText(new Date(item.createdAt).toLocaleDateString())}</time><span aria-hidden="true">·</span><span>${Number(item.replyCount || 0)} ${Number(item.replyCount || 0) === 1 ? 'reply' : 'replies'}</span></div>${attachmentMarkup(item.attachments || [])}</div></article>`).join('')}</div>`;
}

function attachmentMarkup(attachments = []) {
  if (!attachments.length) return '';
  return `<div class="community-attachments">${attachments.map(file => `<a class="community-attachment ${file.image ? 'is-image' : ''}" href="${escapeText(file.url)}" target="_blank" rel="noopener noreferrer" aria-label="Open attachment ${escapeText(file.name)}">${file.image ? `<img src="${escapeText(file.url)}" alt="${escapeText(file.name)}" loading="lazy">` : `<span class="community-attachment-icon" aria-hidden="true">${icon('resources', 18)}</span>`}<span class="community-attachment-name">${escapeText(file.name)}</span></a>`).join('')}</div>`;
}

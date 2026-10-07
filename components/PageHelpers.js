import { escapeText, emptyState } from './Navigation.js';
import { savedResourceIds } from '../services/resourceApi.js';

export function panel(title, body, action = '') {
  return `<section class="panel"><div class="panel-head"><h2>${escapeText(title)}</h2>${action}</div>${body}</section>`;
}
export async function resourceCards(items, userId) {
  if (!items.length) return emptyState('No resources shared yet', 'Be the first to contribute a study guide, notes, or another useful learning resource.', '<button class="btn btn-sm" data-modal="resource">＋ Share a resource</button>');
  const savedIds = await savedResourceIds(userId);
  return `<div class="resource-grid">${items.map(item => `<article class="resource-card"><div class="resource-art"><div class="resource-placeholder">▤</div><span class="filetag">${escapeText(item.type || 'Resource')}</span></div><div class="resource-info"><h3>${escapeText(item.title)}</h3><p>${escapeText(item.subject || 'General')} · ${escapeText(item.level || 'All levels')}</p>${item.description ? `<p class="resource-description">${escapeText(item.description)}</p>` : ''}${attachmentMarkup(item.attachments)}<div class="resource-actions"><span>Shared by ${escapeText(item.authorName || 'a learner')}</span><button class="save-btn" data-save="${escapeText(item.id)}">${savedIds.includes(item.id) ? '✓ Saved' : '♡ Save'}</button></div></div></article>`).join('')}</div>`;
}
export function groupRows(groups, userId, reviewsByGroup = {}) {
  if (!groups.length) return emptyState('No study groups yet', 'Create the first group and invite learners to work together.', '<button class="btn btn-sm" data-modal="group">＋ Create a group</button>');
  return `<div class="groups-list">${groups.map(group => {
    const joined = group.memberIds?.includes(userId);
    const reviews = reviewsByGroup[group.id] || [];
    const average = reviews.length ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) : '';
    return `<div class="group-row"><div class="group-avatar">♧</div><div class="group-details"><h3>${escapeText(group.name)}</h3><p>${escapeText(group.description)}</p><span class="group-review-summary">${average ? `${average} ★ · ${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}` : 'No reviews yet'}</span></div><span class="group-count">${group.memberIds?.length || 1} members</span>${joined ? `<button class="btn btn-light btn-sm" data-review-type="group" data-review-target="${escapeText(group.id)}" data-review-name="${escapeText(group.name)}">Review</button><button class="btn btn-sm" data-group-chat="${escapeText(group.id)}">Open chat</button>` : `<button class="join-btn" data-join="${escapeText(group.id)}">Join</button>`}</div>`;
  }).join('')}</div>`;
}
export function questionRows(questions) {
  if (!questions.length) return emptyState('No questions yet', 'Post a question to get help from learners in the community.', '<button class="btn btn-sm" data-modal="question">＋ Ask a question</button>');
  return `<div>${questions.map(question => `<article class="question-row"><div class="question-avatar">${escapeText((question.authorName || '?')[0])}</div><div class="question-main"><h3>${escapeText(question.title)}</h3><div>${question.subject ? `<span class="tag">${escapeText(question.subject)}</span>` : ''}</div><p class="question-meta">Asked by ${escapeText(question.authorName || 'a learner')} · ${new Date(question.createdAt).toLocaleDateString()}</p><p class="question-meta">${question.answerCount || 0} answers</p></div><div class="vote-box"><button data-vote="${escapeText(question.id)}" aria-label="Upvote">⌃</button><span>${question.votes || 0}</span></div></article>`).join('')}</div>`;
}
export function discussionRows(discussions) {
  if (!discussions.length) return emptyState('The forum is ready for its first post', 'Start a conversation, share a study tip, or ask the community what they think.', '<button class="btn btn-sm" data-modal="discussion">＋ Start a discussion</button>');
  return `<div>${discussions.map(item => `<article class="forum-row"><div class="question-avatar">${escapeText((item.authorName || '?')[0])}</div><div class="forum-row-content"><h3>${escapeText(item.title)}</h3>${item.description ? `<p>${escapeText(item.description)}</p>` : ''}<p>Started by ${escapeText(item.authorName || 'a learner')} · ${new Date(item.createdAt).toLocaleDateString()} · ${item.replyCount || 0} replies</p>${attachmentMarkup(item.attachments)}</div></article>`).join('')}</div>`;
}

function attachmentMarkup(attachments = []) {
  if (!attachments.length) return '';
  return `<div class="community-attachments">${attachments.map(file => `<a class="community-attachment ${file.image ? 'is-image' : ''}" href="${escapeText(file.url)}" target="_blank" rel="noopener noreferrer" aria-label="Open attachment ${escapeText(file.name)}">${file.image ? `<img src="${escapeText(file.url)}" alt="${escapeText(file.name)}" loading="lazy">` : `<span class="community-attachment-icon" aria-hidden="true">▤</span>`}<span class="community-attachment-name">${escapeText(file.name)}</span></a>`).join('')}</div>`;
}

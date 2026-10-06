import { escapeText, emptyState } from './Navigation.js';
import { savedResourceIds } from '../services/resourceApi.js';

export function panel(title, body, action = '') {
  return `<section class="panel"><div class="panel-head"><h2>${escapeText(title)}</h2>${action}</div>${body}</section>`;
}
export async function resourceCards(items, userId) {
  if (!items.length) return emptyState('No resources shared yet', 'Be the first to contribute a study guide, notes, or another useful learning resource.', '<button class="btn btn-sm" data-modal="resource">＋ Share a resource</button>');
  const savedIds = await savedResourceIds(userId);
  return `<div class="resource-grid">${items.map(item => `<article class="resource-card"><div class="resource-art"><div class="resource-placeholder">▤</div><span class="filetag">${escapeText(item.type || 'Resource')}</span></div><div class="resource-info"><h3>${escapeText(item.title)}</h3><p>${escapeText(item.subject || 'General')} · ${escapeText(item.level || 'All levels')}</p><div class="resource-actions"><span>Shared by ${escapeText(item.authorName || 'a learner')}</span><button class="save-btn" data-save="${escapeText(item.id)}">${savedIds.includes(item.id) ? '✓ Saved' : '♡ Save'}</button></div></div></article>`).join('')}</div>`;
}
export function groupRows(groups, userId) {
  if (!groups.length) return emptyState('No study groups yet', 'Create the first group and invite learners to work together.', '<button class="btn btn-sm" data-modal="group">＋ Create a group</button>');
  return `<div class="groups-list">${groups.map(group => `<div class="group-row"><div class="group-avatar">♧</div><div class="group-details"><h3>${escapeText(group.name)}</h3><p>${escapeText(group.description)}</p></div><span class="group-count">${group.memberIds?.length || 1} members</span><button class="join-btn ${group.memberIds?.includes(userId) ? 'joined' : ''}" data-join="${escapeText(group.id)}">${group.memberIds?.includes(userId) ? 'Joined' : 'Join'}</button></div>`).join('')}</div>`;
}
export function questionRows(questions) {
  if (!questions.length) return emptyState('No questions yet', 'Post a question to get help from learners in the community.', '<button class="btn btn-sm" data-modal="question">＋ Ask a question</button>');
  return `<div>${questions.map(question => `<article class="question-row"><div class="question-avatar">${escapeText((question.authorName || '?')[0])}</div><div class="question-main"><h3>${escapeText(question.title)}</h3><div>${question.subject ? `<span class="tag">${escapeText(question.subject)}</span>` : ''}</div><p class="question-meta">Asked by ${escapeText(question.authorName || 'a learner')} · ${new Date(question.createdAt).toLocaleDateString()}</p><p class="question-meta">${question.answerCount || 0} answers</p></div><div class="vote-box"><button data-vote="${escapeText(question.id)}" aria-label="Upvote">⌃</button><span>${question.votes || 0}</span></div></article>`).join('')}</div>`;
}
export function discussionRows(discussions) {
  if (!discussions.length) return emptyState('The forum is ready for its first post', 'Start a conversation, share a study tip, or ask the community what they think.', '<button class="btn btn-sm" data-modal="discussion">＋ Start a discussion</button>');
  return `<div>${discussions.map(item => `<article class="forum-row"><div class="question-avatar">${escapeText((item.authorName || '?')[0])}</div><div><h3>${escapeText(item.title)}</h3><p>Started by ${escapeText(item.authorName || 'a learner')} · ${new Date(item.createdAt).toLocaleDateString()} · ${item.replyCount || 0} replies</p></div></article>`).join('')}</div>`;
}

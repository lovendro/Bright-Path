import { listGroups, listGroupMessages } from '../../services/groupApi.js';
import { listReviewsForGroups } from '../../services/reviewApi.js';
import { emptyState, escapeText } from '../Navigation.js';
import { groupRows } from '../PageHelpers.js';
import { icon } from '../Icons.js';
export async function StudyGroupsPage(user, query = '', selectedGroupChatId = '', view = 'all', subject = '') {
  const allGroups = await listGroups();
  const groups = allGroups.filter(group =>
    `${group.name} ${group.description} ${group.subject || ''}`.toLowerCase().includes(query.toLowerCase())
    && (!subject || group.subject === subject)
    && (view !== 'mine' || group.memberIds?.includes(user.id))
  );
  const activeGroup = groups.find(group => group.id === selectedGroupChatId);
  if (selectedGroupChatId && activeGroup) {
    if (!activeGroup.memberIds?.includes(user.id)) throw new Error('Join this study group before opening its chat.');
    const messages = await listGroupMessages(activeGroup.id);
    const messageRows = messages.map(message => `<article class="group-chat-message bubble ${message.senderId === user.id ? 'mine' : ''}" data-message-id="${escapeText(message.id)}"><strong>${escapeText(message.senderName || 'Learner')}</strong>${message.text ? `<p>${escapeText(message.text)}</p>` : ''}${message.imageUrl ? `<img src="${escapeText(message.imageUrl)}" alt="Picture shared in the study group" loading="lazy">` : ''}<time>${new Date(message.createdAt).toLocaleString()}</time>${message.senderId === user.id ? `<div class="message-actions"><button class="message-menu-trigger" type="button" data-message-menu-trigger aria-label="More message options" aria-expanded="false">⋮</button><div class="message-menu" data-message-menu hidden><button type="button" data-message-menu-action="edit" data-message-kind="group">Edit message</button><button type="button" data-message-menu-action="unsend" data-message-kind="group">Unsend message</button></div></div>` : ''}</article>`).join('');
    return `<div class="welcome-row group-chat-welcome"><div><span class="eyebrow">Study group conversation</span><h1>${escapeText(activeGroup.name)}</h1><p>${escapeText(activeGroup.description)}</p></div><button class="btn btn-light btn-sm" data-close-group-chat>${icon('back', 17)} Back to groups</button></div><section class="panel group-chat-panel"><div class="group-chat-thread" role="log" aria-label="${escapeText(activeGroup.name)} group chat" aria-live="polite" data-group-id="${escapeText(activeGroup.id)}" data-latest-at="${escapeText(messages.at(-1)?.createdAt || '')}">${messageRows || '<div class="chat-empty"><span aria-hidden="true">✦</span><strong>Start the group conversation</strong><p>Share a question, idea, or learning resource.</p></div>'}</div><form id="group-message-form" class="message-compose group-message-compose" data-group-id="${escapeText(activeGroup.id)}"><label class="sr-only" for="group-message-input">Write a group message</label><textarea class="field" id="group-message-input" name="text" maxlength="2000" rows="2" placeholder="Write a message"></textarea><div class="group-chat-compose"><label class="image-attach">${icon('upload', 16)} Add picture<input type="file" name="image" accept="image/jpeg,image/png,image/webp"></label><span>JPG, PNG, or WebP · up to 5 MB</span><button class="btn btn-sm" type="submit">Send ${icon('send', 15)}</button></div></form></section>`;
  }
  const reviews = await listReviewsForGroups(groups.map(group => group.id));
  const reviewsByGroup = reviews.reduce((grouped, review) => {
    const groupId = review.target_id || review.targetId;
    (grouped[groupId] ||= []).push(review);
    return grouped;
  }, {});
  const body = groups.length
    ? groupRows(groups, user.id, reviewsByGroup)
    : emptyState(view === 'mine' ? 'No joined groups yet' : 'No groups match those filters',
      view === 'mine' ? 'Join a study group and it will appear here.' : 'Try a different search or clear the subject filter.',
      view === 'mine' ? '<button class="btn btn-sm" data-group-view="all">Explore groups</button>' : '<button class="btn btn-light btn-sm" data-group-clear>Clear filters</button> <button class="btn btn-sm" data-modal="group">＋ Create a group</button>');
  const subjects = [...new Set(allGroups.map(group => group.subject).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const subjectFilter = `<label>Subject<select class="field" data-group-subject><option value="">All subjects</option>${subjects.map(item => `<option value="${escapeText(item)}"${item === subject ? ' selected' : ''}>${escapeText(item)}</option>`).join('')}</select></label>`;
  return `<div class="welcome-row"><div><span class="eyebrow">Find your people</span><h1>Study Groups</h1><p>Join or create a group to collaborate, share ideas, and learn together.</p></div><button class="btn btn-sm" data-modal="group">＋ Create Group</button></div>
    <div class="group-controls"><div class="content-search"><label class="sr-only" for="page-search">Search study groups</label><input id="page-search" placeholder="Search groups by name or subject" value="${escapeText(query)}"></div>${subjectFilter}</div>
    <div class="filter-tabs" role="tablist" aria-label="Study group views"><button type="button" class="filter-tab ${view === 'all' ? 'active' : ''}" data-group-view="all" role="tab" aria-selected="${view === 'all'}">All Groups <span>${allGroups.length}</span></button><button type="button" class="filter-tab ${view === 'mine' ? 'active' : ''}" data-group-view="mine" role="tab" aria-selected="${view === 'mine'}">My Groups <span>${allGroups.filter(group => group.memberIds?.includes(user.id)).length}</span></button></div>
    <section class="panel"><div class="panel-head"><h2>${view === 'mine' ? 'My study groups' : 'All study groups'}</h2><span class="view-all">${groups.length} ${groups.length === 1 ? 'group' : 'groups'}</span></div>${body}</section>`;
}

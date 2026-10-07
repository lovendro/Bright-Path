import { listGroups, listGroupMessages } from '../../services/groupApi.js';
import { listReviews } from '../../services/reviewApi.js';
import { emptyState, escapeText } from '../Navigation.js';
import { groupRows } from '../PageHelpers.js';
export async function StudyGroupsPage(user, query = '', selectedGroupChatId = '') {
  const groups = (await listGroups()).filter(group => `${group.name} ${group.description} ${group.subject || ''}`.toLowerCase().includes(query.toLowerCase()));
  const activeGroup = groups.find(group => group.id === selectedGroupChatId);
  if (selectedGroupChatId && activeGroup) {
    if (!activeGroup.memberIds?.includes(user.id)) throw new Error('Join this study group before opening its chat.');
    const messages = await listGroupMessages(activeGroup.id);
    const messageRows = messages.map(message => `<article class="group-chat-message ${message.senderId === user.id ? 'mine' : ''}" data-message-id="${escapeText(message.id)}"><strong>${escapeText(message.senderName || 'Learner')}</strong>${message.text ? `<p>${escapeText(message.text)}</p>` : ''}${message.imageUrl ? `<img src="${escapeText(message.imageUrl)}" alt="Picture shared in the study group" loading="lazy">` : ''}<time>${new Date(message.createdAt).toLocaleString()}</time></article>`).join('');
    return `<div class="welcome-row"><div><h1>${escapeText(activeGroup.name)} chat</h1><p>${escapeText(activeGroup.description)}</p></div><button class="btn btn-light btn-sm" data-close-group-chat>Back to groups</button></div><section class="panel group-chat-panel"><div class="group-chat-thread" data-group-id="${escapeText(activeGroup.id)}" data-latest-at="${escapeText(messages.at(-1)?.createdAt || '')}">${messageRows || '<p class="settings-hint">No messages yet. Start the group conversation.</p>'}</div><form id="group-message-form" data-group-id="${escapeText(activeGroup.id)}"><textarea class="field" name="text" maxlength="2000" rows="2" placeholder="Write a message"></textarea><div class="group-chat-compose"><label class="image-attach">Add picture<input type="file" name="image" accept="image/jpeg,image/png,image/webp"></label><span>JPG, PNG, or WebP · up to 5 MB</span><button class="btn btn-sm" type="submit">Send</button></div></form></section>`;
  }
  const reviews = await Promise.all(groups.map(async group => [group.id, await listReviews('group', group.id)]));
  const reviewsByGroup = Object.fromEntries(reviews);
  const body = groups.length ? groupRows(groups, user.id, reviewsByGroup) : emptyState(query ? 'No groups match that search' : 'No study groups have been created', query ? 'Try another search.' : 'Create the first group and invite other learners to join.', '<button class="btn btn-sm" data-modal="group">＋ Create the first group</button>');
  return `<div class="welcome-row"><div><h1>Study Groups</h1><p>Find learners with shared goals, or start a new group.</p></div><button class="btn btn-sm" data-modal="group">＋ Create Group</button></div><div class="content-toolbar"><div class="content-search"><input id="page-search" placeholder="Search groups" value="${escapeText(query)}"></div></div><section class="panel"><div class="panel-head"><h2>All study groups</h2><span class="view-all">${groups.length} ${groups.length === 1 ? 'group' : 'groups'}</span></div>${body}</section>`;
}

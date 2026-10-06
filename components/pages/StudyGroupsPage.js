import { listGroups } from '../../api/groupApi.js';
import { emptyState, escapeText } from '../Navigation.js';
import { groupRows } from '../PageHelpers.js';
export async function StudyGroupsPage(user, query = '') {
  const groups = (await listGroups()).filter(group => `${group.name} ${group.description} ${group.subject || ''}`.toLowerCase().includes(query.toLowerCase()));
  const body = groups.length ? groupRows(groups, user.id) : emptyState(query ? 'No groups match that search' : 'No study groups have been created', query ? 'Try another search.' : 'Create the first group and invite other learners to join.', '<button class="btn btn-sm" data-modal="group">＋ Create the first group</button>');
  return `<div class="welcome-row"><div><h1>Study Groups</h1><p>Find learners with shared goals, or start a new group.</p></div><button class="btn btn-sm" data-modal="group">＋ Create Group</button></div><div class="content-toolbar"><div class="content-search"><input id="page-search" placeholder="Search groups" value="${escapeText(query)}"></div></div><section class="panel"><div class="panel-head"><h2>All study groups</h2><span class="view-all">${groups.length} ${groups.length === 1 ? 'group' : 'groups'}</span></div>${body}</section>`;
}

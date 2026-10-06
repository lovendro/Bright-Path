import { listDiscussions } from '../../services/discussionApi.js';
import { emptyState, escapeText } from '../Navigation.js';
import { discussionRows } from '../PageHelpers.js';
export async function CommunityPage(_user, query = '') {
  const discussions = (await listDiscussions()).filter(item => `${item.title} ${item.description || ''}`.toLowerCase().includes(query.toLowerCase()));
  const body = discussions.length ? discussionRows(discussions) : emptyState(query ? 'No discussions found' : 'The community forum is waiting for its first discussion', query ? 'Try a different search.' : 'Share an idea, ask the community, or start a conversation.', '<button class="btn btn-sm" data-modal="discussion">＋ Start a discussion</button>');
  return `<div class="welcome-row"><div><h1>Community</h1><p>A place to exchange ideas, experiences, and study strategies.</p></div><button class="btn btn-sm" data-modal="discussion">＋ New Discussion</button></div><div class="content-toolbar"><div class="content-search"><input id="page-search" placeholder="Search discussions" value="${escapeText(query)}"></div></div><section class="panel"><div class="panel-head"><h2>Discussions</h2><span class="view-all">${discussions.length} ${discussions.length === 1 ? 'discussion' : 'discussions'}</span></div>${body}</section>`;
}

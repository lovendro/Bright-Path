import { listDiscussions } from '../../services/discussionApi.js';
import { emptyState, escapeText } from '../Navigation.js';
import { discussionRows } from '../PageHelpers.js';

export async function CommunityPage(_user, query = '') {
  const discussions = (await listDiscussions()).filter(item =>
    `${item.title} ${item.description || ''} ${item.authorName || ''}`.toLowerCase().includes(query.toLowerCase())
  );
  const body = discussions.length
    ? discussionRows(discussions)
    : emptyState(query ? 'No discussions found' : "You're first to the Community Forum", query ? 'Try a different search.' : 'Share an idea, ask the community, or start a conversation.', '<button class="btn btn-sm" data-modal="discussion">＋ New Discussion</button>');
  return `<div class="welcome-row community-welcome"><div><span class="eyebrow">People · Ideas · Brighter futures</span><h1>Community Forum</h1><p>Share ideas, experiences and study strategies with other learners.</p></div><button class="btn btn-sm" data-modal="discussion">＋ New Discussion</button></div><div class="content-toolbar"><div class="content-search"><label class="sr-only" for="page-search">Search discussions</label><input id="page-search" placeholder="Search discussions" value="${escapeText(query)}"></div></div><section class="panel community-feed"><div class="panel-head"><h2>Discussions</h2><span class="view-all">${discussions.length} ${discussions.length === 1 ? 'discussion' : 'discussions'}</span></div>${body}</section>`;
}

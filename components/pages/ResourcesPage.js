import { listResources } from '../../api/resourceApi.js';
import { emptyState, escapeText } from '../Navigation.js';
import { resourceCards } from '../PageHelpers.js';
export async function ResourcesPage(user, query = '') {
  const resources = (await listResources()).filter(item => `${item.title} ${item.subject} ${item.description}`.toLowerCase().includes(query.toLowerCase()));
  const body = resources.length ? await resourceCards(resources, user.id) : emptyState(query ? 'No matching resources' : 'The resource library is empty', query ? 'Try a different search term.' : 'Be the first to share notes, a study guide, or another useful resource.', '<button class="btn btn-sm" data-modal="resource">＋ Share the first resource</button>');
  return `<div class="welcome-row"><div><h1>Learning Resources</h1><p>Discover and share learner-created materials.</p></div><button class="btn btn-sm" data-modal="resource">＋ Share Resource</button></div><div class="content-toolbar"><div class="content-search"><input id="page-search" placeholder="Search resources by title or subject" value="${escapeText(query)}"></div></div><section class="panel"><div class="panel-head"><h2>Community library</h2><span class="view-all">${resources.length} ${resources.length === 1 ? 'resource' : 'resources'}</span></div>${body}</section>`;
}

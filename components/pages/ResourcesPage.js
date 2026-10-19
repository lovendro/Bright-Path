import { listResources } from '../../services/resourceApi.js';
import { emptyState, escapeText } from '../Navigation.js';
import { resourceCards } from '../PageHelpers.js';

function filterOptions(resources, field, selected, label) {
  const values = [...new Set(resources.map(item => item[field]).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  return `<label>${label}<select class="field" data-resource-filter="${field}"><option value="">All ${label.toLowerCase()}</option>${values.map(value => `<option value="${escapeText(value)}"${selected === value ? ' selected' : ''}>${escapeText(value)}</option>`).join('')}</select></label>`;
}

export async function ResourcesPage(user, query = '', filters = {}) {
  const allResources = await listResources();
  let resources = allResources.filter(item => `${item.title} ${item.subject || ''} ${item.description || ''}`.toLowerCase().includes(query.toLowerCase()));
  if (filters.subject) resources = resources.filter(item => item.subject === filters.subject);
  if (filters.type) resources = resources.filter(item => item.type === filters.type);
  if (filters.level) resources = resources.filter(item => item.level === filters.level);
  if (filters.sort === 'title') resources.sort((a, b) => a.title.localeCompare(b.title));
  else if (filters.sort === 'oldest') resources.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const body = resources.length
    ? await resourceCards(resources, user.id)
    : emptyState(query || filters.subject || filters.type || filters.level ? 'No resources match those filters' : 'The resource library is empty',
      query || filters.subject || filters.type || filters.level ? 'Try another search or clear your filters.' : 'Be the first to share notes, a study guide, or another useful resource.',
      '<button class="btn btn-light btn-sm" data-resource-clear>Clear filters</button> <button class="btn btn-sm" data-modal="resource">＋ Share a resource</button>');
  const sort = filters.sort || 'newest';
  return `<div class="welcome-row"><div><span class="eyebrow">Learn from what others share</span><h1>Learning Resources</h1><p>Discover notes, books, past papers, and other learner-created materials.</p></div><button class="btn btn-sm" data-modal="resource">＋ Upload Resource</button></div>
    <div class="resource-controls">
      <div class="content-search"><label class="sr-only" for="page-search">Search learning resources</label><input id="page-search" placeholder="Search resources by title or subject" value="${escapeText(query)}"></div>
      ${filterOptions(allResources, 'subject', filters.subject || '', 'Subject')}
      ${filterOptions(allResources, 'type', filters.type || '', 'Type')}
      ${filterOptions(allResources, 'level', filters.level || '', 'Level')}
      <label>Sort<select class="field" data-resource-filter="sort"><option value="newest"${sort === 'newest' ? ' selected' : ''}>Newest</option><option value="oldest"${sort === 'oldest' ? ' selected' : ''}>Oldest</option><option value="title"${sort === 'title' ? ' selected' : ''}>Title A–Z</option></select></label>
    </div>
    <section class="panel"><div class="panel-head"><h2>Community library</h2><span class="view-all">${resources.length} ${resources.length === 1 ? 'resource' : 'resources'}</span></div>${body}</section>`;
}

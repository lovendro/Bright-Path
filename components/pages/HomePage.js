import { listRecentResources } from '../../services/resourceApi.js';
import { listRecentGroups } from '../../services/groupApi.js';
import { listRecentQuestions } from '../../services/questionApi.js';
import { escapeText } from '../Navigation.js';
import { groupRows, panel, questionRows, resourceCards } from '../PageHelpers.js';

export async function HomePage(user) {
  const [resources, groups, questions] = await Promise.all([listRecentResources(4), listRecentGroups(3), listRecentQuestions(3)]);
  const resourceContent = await resourceCards(resources, user.id);
  const firstName = String(user.name || '').trim().split(/\s+/)[0] || 'learner';
  const starter = `<div class="quick-grid"><a class="quick-card" href="#resources" data-page="resources"><div class="feature-icon" aria-hidden="true">▣</div><h3>Find resources</h3><p>Explore helpful learning materials shared by the community.</p></a><a class="quick-card" href="#groups" data-page="groups"><div class="feature-icon" aria-hidden="true">♧</div><h3>Join a study group</h3><p>Learn together and exchange ideas with other learners.</p></a><a class="quick-card" href="#qa" data-page="qa"><div class="feature-icon" aria-hidden="true">?</div><h3>Ask a question</h3><p>Get help and share what you know with the community.</p></a><a class="quick-card" href="#ai" data-page="ai"><div class="feature-icon" aria-hidden="true">✦</div><h3>Explore AI guides</h3><p>Use AI thoughtfully while keeping your own understanding at the center.</p></a></div>`;
  return `<div class="welcome-row"><div><span class="eyebrow">Your learning community</span><h1>Welcome back, ${escapeText(firstName)}!</h1><p>Keep learning. Keep sharing. Keep growing.</p></div><div class="quote-card">A shared idea can become someone's next step forward.</div></div><section aria-label="Quick actions">${starter}</section>${panel('Resources to explore', resourceContent, '<a class="view-all" href="#resources" data-page="resources">Explore resources →</a>')}${panel('Study groups', groupRows(groups.slice(0, 3), user.id), '<a class="view-all" href="#groups" data-page="groups">Find a group →</a>')}${panel('Questions from the community', questionRows(questions.slice(0, 3)), '<a class="view-all" href="#qa" data-page="qa">Browse questions →</a>')}`;
}

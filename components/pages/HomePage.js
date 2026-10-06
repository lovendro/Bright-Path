import { listResources } from '../../services/resourceApi.js';
import { listGroups } from '../../services/groupApi.js';
import { listQuestions } from '../../services/questionApi.js';
import { escapeText } from '../Navigation.js';
import { groupRows, panel, questionRows, resourceCards } from '../PageHelpers.js';

export async function HomePage(user) {
  const [resources, groups, questions] = await Promise.all([listResources(), listGroups(), listQuestions()]);
  const resourceContent = await resourceCards(resources.slice(0, 4), user.id);
  const starter = `<div class="quick-grid"><article class="quick-card" data-page="resources"><div class="feature-icon">▣</div><h3>Share a resource</h3><p>Add study material for the community.</p></article><article class="quick-card" data-page="groups"><div class="feature-icon">♧</div><h3>Start a study group</h3><p>Bring learners together.</p></article><article class="quick-card" data-page="qa"><div class="feature-icon">?</div><h3>Ask your first question</h3><p>Get help from other learners.</p></article><article class="quick-card" data-page="community"><div class="feature-icon">✦</div><h3>Start a discussion</h3><p>Exchange ideas and experiences.</p></article></div>`;
  return `<div class="welcome-row"><div><h1>Welcome, ${escapeText(user.name)}!</h1><p>Your Bright Path community is just getting started. Make it yours.</p></div><div class="quote-card">A shared idea can become someone's next step forward. 🌱</div></div>${starter}${panel('Resources shared with the community', resourceContent, '<span class="view-all" data-page="resources">Explore all →</span>')}${panel('Study groups', groupRows(groups.slice(0, 3), user.id), '<span class="view-all" data-page="groups">Explore groups →</span>')}${panel('Questions', questionRows(questions.slice(0, 3)), '<span class="view-all" data-page="qa">Browse Q&A →</span>')}`;
}

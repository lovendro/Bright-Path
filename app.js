import { currentUser, login, logout, register, createResource, createGroup, createQuestion, createDiscussion, toggleSavedResource, joinGroup, voteQuestion, createMessage, markNotificationsRead, updateProfile, getProfile } from './api/index.js';
import { appShell, escapeText } from './components/Navigation.js';
import { LandingPage } from './components/pages/LandingPage.js';
import { SignupPage } from './components/pages/SignupPage.js';
import { LoginPage } from './components/pages/LoginPage.js';
import { HomePage } from './components/pages/HomePage.js';
import { ResourcesPage } from './components/pages/ResourcesPage.js';
import { StudyGroupsPage } from './components/pages/StudyGroupsPage.js';
import { QuestionsPage } from './components/pages/QuestionsPage.js';
import { CommunityPage } from './components/pages/CommunityPage.js';
import { AILearningHubPage } from './components/pages/AILearningHubPage.js';
import { MessagesPage } from './components/pages/MessagesPage.js';
import { NotificationsPage } from './components/pages/NotificationsPage.js';
import { ProfilePage } from './components/pages/ProfilePage.js';

const protectedPages = new Set(['home', 'resources', 'groups', 'qa', 'community', 'ai', 'messages', 'notifications', 'profile']);
const components = {
  home: HomePage,
  resources: ResourcesPage,
  groups: StudyGroupsPage,
  qa: QuestionsPage,
  community: CommunityPage,
  ai: AILearningHubPage,
  messages: MessagesPage,
  notifications: NotificationsPage,
  profile: ProfilePage
};
let user = currentUser();
let page = location.hash.slice(1) || 'home';
let query = '';
let toastTimer;
let renderVersion = 0;

function notify(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

async function render(animate = true) {
  const thisRender = ++renderVersion;
  const root = document.getElementById('app');
  if (page === 'home' && !user) {
    root.innerHTML = LandingPage();
    return;
  }
  if (protectedPages.has(page) && !user) page = 'login';
  if (page === 'signup') root.innerHTML = SignupPage();
  else if (page === 'login') root.innerHTML = LoginPage();
  else if (protectedPages.has(page) && user) {
    const component = components[page];
    try {
      const content = await component(user, query);
      if (thisRender !== renderVersion) return;
      root.innerHTML = appShell(content, user, animate);
    } catch (error) {
      if (thisRender !== renderVersion) return;
      root.innerHTML = appShell(`<section class="panel"><h1>Couldn't load this page</h1><p>${escapeText(error.message || 'Check your connection and Supabase setup, then try again.')}</p><button class="btn btn-sm" data-action="retry">Try again</button></section>`, user, false);
    }
  } else root.innerHTML = LandingPage();
}

function navigate(nextPage) {
  const allowed = ['home', 'signup', 'login', ...protectedPages];
  page = allowed.includes(nextPage) ? nextPage : 'home';
  if (protectedPages.has(page) && !user && page !== 'home') {
    sessionStorage.setItem('bright-path:return-to', page);
    page = 'signup';
  }
  query = '';
  history.pushState(null, '', `#${page}`);
  render();
  window.scrollTo(0, 0);
}

async function showModal(kind) {
  if (kind === 'edit-profile') {
    const profile = await getProfile(user.id) || {};
    document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop" id="modal-backdrop"><section class="modal" role="dialog" aria-modal="true"><div class="modal-head"><h2>Edit profile</h2><button class="modal-close" data-close-modal aria-label="Close">×</button></div><form id="profile-form"><label for="profile-bio">About me</label><textarea class="field" id="profile-bio" name="bio" maxlength="500" placeholder="A little about your learning journey">${escapeText(profile.bio || '')}</textarea><label for="profile-interests">Learning interests</label><input class="field" id="profile-interests" name="interests" maxlength="200" placeholder="e.g. biology, design, history" value="${escapeText(profile.interests || '')}"><button class="btn">Save profile</button></form></section></div>`);
    return;
  }
  const config = {
    resource: ['Share a resource', 'Resource title', 'Describe what other learners will find useful', 'Share Resource'],
    group: ['Create a study group', 'Group name', 'What will this group learn together?', 'Create Group'],
    question: ['Ask a question', 'Question title', 'Include details about what you have tried or where you are stuck', 'Post Question'],
    discussion: ['Start a discussion', 'Discussion title', 'Share your idea or question with the community', 'Post Discussion']
  }[kind];
  if (!config) return;
  const [title, titleLabel, detailPlaceholder, submitLabel] = config;
  document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop" id="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><h2 id="modal-title">${title}</h2><button class="modal-close" data-close-modal aria-label="Close">×</button></div><form id="create-form" data-kind="${kind}"><label for="create-title">${titleLabel}</label><input class="field" id="create-title" name="title" required maxlength="140" placeholder="${titleLabel}">${kind === 'resource' || kind === 'question' ? `<label for="create-subject">Subject <span class="optional">(optional)</span></label><input class="field" id="create-subject" name="subject" maxlength="60" placeholder="e.g. Biology">` : ''}<label for="create-description">Details</label><textarea class="field" id="create-description" name="description" required maxlength="3000" placeholder="${detailPlaceholder}"></textarea>${kind === 'resource' ? '<label for="create-type">Resource type</label><select class="field" id="create-type" name="type"><option>Notes</option><option>Study guide</option><option>Article</option><option>Practice questions</option><option>Other</option></select>' : ''}<button class="btn">${submitLabel}</button></form></section></div>`);
  document.getElementById('create-title').focus();
}

async function createContent(form) {
  const fields = new FormData(form);
  const common = {
    title: String(fields.get('title')).trim(),
    description: String(fields.get('description')).trim(),
    subject: String(fields.get('subject') || '').trim(),
    authorName: user.name
  };
  const kind = form.dataset.kind;
  if (kind === 'resource') await createResource(user.id, { ...common, type: String(fields.get('type') || 'Notes'), level: user.level });
  if (kind === 'group') await createGroup(user.id, { ...common, name: common.title });
  if (kind === 'question') await createQuestion(user.id, common);
  if (kind === 'discussion') await createDiscussion(user.id, common);
  document.getElementById('modal-backdrop')?.remove();
  page = ({ resource: 'resources', group: 'groups', question: 'qa', discussion: 'community' })[kind];
  history.replaceState(null, '', `#${page}`);
  render();
  notify('Your first contribution is live in this browser.');
}

async function preserveSearch(input) {
  query = input.value;
  const position = input.selectionStart;
  await render(false);
  const replacement = document.getElementById(input.id);
  replacement?.focus();
  replacement?.setSelectionRange(position, position);
}

document.addEventListener('click', async event => {
  const target = event.target.closest('[data-page], [data-modal], [data-action], [data-save], [data-join], [data-vote], [data-close-modal]');
  if (!target) return;
  try {
    if (target.dataset.page) {
      event.preventDefault();
      navigate(target.dataset.page);
    } else if (target.dataset.modal) await showModal(target.dataset.modal);
    else if (target.hasAttribute('data-close-modal')) document.getElementById('modal-backdrop')?.remove();
    else if (target.dataset.save) {
      const saved = await toggleSavedResource(user.id, target.dataset.save);
      await render(false);
      notify(saved ? 'Resource saved.' : 'Resource removed from saved items.');
    } else if (target.dataset.join) {
      await joinGroup(user.id, target.dataset.join);
      await render(false);
      notify('You joined the study group.');
    } else if (target.dataset.vote) {
      await voteQuestion(user.id, target.dataset.vote);
      await render(false);
    } else if (target.dataset.action === 'logout') {
      logout();
      user = null;
      page = 'home';
      history.replaceState(null, '', '#home');
      render();
      notify('You have logged out.');
    } else if (target.dataset.action === 'mark-read') {
      await markNotificationsRead(user.id);
      await render(false);
    } else if (target.dataset.action === 'retry') await render();
  } catch (error) {
    notify(error.message || 'The request failed. Check your connection and try again.');
  }
});

document.addEventListener('submit', async event => {
  const form = event.target;
  if (form.id === 'auth-form') {
    event.preventDefault();
    const data = new FormData(form);
    try {
      const authResult = form.dataset.auth === 'signup'
        ? await register({ name: data.get('name'), email: data.get('email'), password: data.get('password'), level: data.get('level') })
        : await login({ email: data.get('email'), password: data.get('password') });
      if (authResult.needsEmailConfirmation) {
        user = null;
        page = 'login';
        history.replaceState(null, '', '#login');
        await render();
        notify('Check your email to confirm your new account, then log in.');
        return;
      }
      user = authResult.user;
      const requestedPage = sessionStorage.getItem('bright-path:return-to') || 'home';
      sessionStorage.removeItem('bright-path:return-to');
      page = requestedPage;
      history.replaceState(null, '', `#${page}`);
      render();
      notify(`Welcome to Bright Path, ${user.name}!`);
    } catch (error) {
      notify(error.message || 'We could not complete your account request.');
    }
  }
  if (form.id === 'create-form') {
    event.preventDefault();
    try { await createContent(form); }
    catch (error) { notify(error.message || 'Could not save your contribution.'); }
  }
  if (form.id === 'message-form') {
    event.preventDefault();
    const text = String(new FormData(form).get('text')).trim();
    if (!text) return;
    try {
      await createMessage(user.id, { text });
      await render(false);
      notify('Message sent.');
    } catch (error) { notify(error.message || 'Could not send the message.'); }
  }
  if (form.id === 'profile-form') {
    event.preventDefault();
    const data = new FormData(form);
    try {
      await updateProfile(user.id, { bio: data.get('bio'), interests: data.get('interests'), level: user.level });
      document.getElementById('modal-backdrop')?.remove();
      await render(false);
      notify('Profile updated.');
    } catch (error) { notify(error.message || 'Could not update your profile.'); }
  }
});

document.addEventListener('input', event => {
  if (event.target.id === 'page-search' || event.target.id === 'global-search') preserveSearch(event.target);
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') document.getElementById('modal-backdrop')?.remove();
  if (event.key === 'Enter' && event.target.id === 'global-search') {
    query = event.target.value;
    if (page === 'home') navigate('resources');
    else render();
  }
});

window.addEventListener('hashchange', () => {
  page = location.hash.slice(1) || 'home';
  render();
});
window.addEventListener('popstate', () => {
  page = location.hash.slice(1) || 'home';
  render();
});
render();

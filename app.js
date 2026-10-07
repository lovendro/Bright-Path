import { confirmEmail, currentUser, login, logout, register, createResource, createGroup, createQuestion, createDiscussion, toggleSavedResource, joinGroup, voteQuestion, markNotificationsRead, updateProfile, getProfile, respondToConversationRequest, searchLearners, sendChatMessage, startConversation } from './services/index.js';
import { appShell, escapeText } from './components/Navigation.js';
import { LandingPage } from './components/pages/LandingPage.js';
import { SignupPage } from './components/pages/SignupPage.js';
import { LoginPage } from './components/pages/LoginPage.js';
import { ConfirmEmailPage } from './components/pages/ConfirmEmailPage.js';
import { HomePage } from './components/pages/HomePage.js';
import { ResourcesPage } from './components/pages/ResourcesPage.js';
import { StudyGroupsPage } from './components/pages/StudyGroupsPage.js';
import { QuestionsPage } from './components/pages/QuestionsPage.js';
import { CommunityPage } from './components/pages/CommunityPage.js';
import { AILearningHubPage } from './components/pages/AILearningHubPage.js';
import { MessagesPage } from './components/pages/MessagesPage.js';
import { NotificationsPage } from './components/pages/NotificationsPage.js';
import { ProfilePage } from './components/pages/ProfilePage.js';
import { SettingsPage } from './components/pages/SettingsPage.js';

const protectedPages = new Set(['home', 'resources', 'groups', 'qa', 'community', 'ai', 'messages', 'notifications', 'profile', 'settings']);
const components = {
  home: HomePage,
  resources: ResourcesPage,
  groups: StudyGroupsPage,
  qa: QuestionsPage,
  community: CommunityPage,
  ai: AILearningHubPage,
  messages: MessagesPage,
  notifications: NotificationsPage,
  profile: ProfilePage,
  settings: SettingsPage
};
let user = currentUser();
let page = location.hash.slice(1) || 'home';
let pendingConfirmationEmail = sessionStorage.getItem('bright-path:confirmation-email') || '';
let query = '';
let selectedConversationId = '';
let learnerSearch = '';
let learnerSearchResults = [];
let toastTimer;
let renderVersion = 0;

function notify(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function setSignupSelectOpen(select, open, focusOption = false) {
  const trigger = select.querySelector('[data-select-trigger]');
  const options = select.querySelector('[role="listbox"]');
  select.classList.toggle('is-open', open);
  trigger.setAttribute('aria-expanded', String(open));
  options.hidden = !open;
  if (open && focusOption) {
    const selected = options.querySelector('[aria-selected="true"]');
    (selected || options.firstElementChild)?.focus();
  }
}

function updatePasswordStrength(password) {
  const strength = document.querySelector('[data-password-strength]');
  const meter = strength?.querySelector('[role="meter"]');
  const label = strength?.querySelector('#password-strength-text');
  if (!strength || !meter || !label) return;
  if (!password) {
    strength.hidden = true;
    return;
  }
  const score = [
    password.length >= 8,
    password.length >= 12,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password)
  ].filter(Boolean).length;
  const level = score <= 1 ? 1 : score <= 2 ? 2 : score <= 3 ? 3 : 4;
  const labelText = ['', 'Weak', 'Fair', 'Good', 'Strong'][level];
  strength.hidden = false;
  strength.dataset.strength = String(level);
  meter.setAttribute('aria-valuenow', String(level));
  meter.setAttribute('aria-valuetext', labelText);
  label.textContent = `Password strength: ${labelText}`;
}

function applyTheme(theme = 'system') {
  const useDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = useDark ? 'dark' : 'light';
}

function loadUserTheme(userId) {
  getProfile(userId)
    .then(profile => applyTheme(profile?.theme || 'system'))
    .catch(error => notify(error.message || 'Could not load your saved theme setting.'));
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
  else if (page === 'confirm') root.innerHTML = ConfirmEmailPage(pendingConfirmationEmail);
  else if (protectedPages.has(page) && user) {
    const component = components[page];
    try {
      const content = page === 'messages'
        ? await component(user, selectedConversationId, learnerSearchResults, learnerSearch)
        : await component(user, query);
      if (thisRender !== renderVersion) return;
      root.innerHTML = appShell(content, user, animate);
    } catch (error) {
      if (thisRender !== renderVersion) return;
      root.innerHTML = appShell(`<section class="panel"><h1>Couldn't load this page</h1><p>${escapeText(error.message || 'Check your connection and Supabase setup, then try again.')}</p><button class="btn btn-sm" data-action="retry">Try again</button></section>`, user, false);
    }
  } else root.innerHTML = LandingPage();
}

function navigate(nextPage) {
  const allowed = ['home', 'signup', 'login', 'confirm', ...protectedPages];
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
  const select = document.querySelector('[data-signup-select]');
  const target = event.target.closest('[data-page], [data-modal], [data-action], [data-save], [data-join], [data-vote], [data-close-modal], [data-select-trigger], [data-select-option], [data-toggle-password], [data-open-conversation], [data-start-conversation], [data-request-response]');
  if (select?.classList.contains('is-open') && !select.contains(event.target)) {
    setSignupSelectOpen(select, false);
  }
  if (!target) return;
  try {
    if (target.hasAttribute('data-toggle-password')) {
      const password = document.getElementById('password');
      const visible = password.type === 'password';
      password.type = visible ? 'text' : 'password';
      target.textContent = visible ? 'Hide' : 'Show';
      target.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
      target.setAttribute('aria-pressed', String(visible));
      password.focus();
    } else if (target.hasAttribute('data-select-trigger')) {
      const isOpen = target.getAttribute('aria-expanded') === 'true';
      setSignupSelectOpen(select, !isOpen, !isOpen);
    } else if (target.hasAttribute('data-select-option')) {
      const value = target.dataset.selectOption;
      select.querySelector('input[name="level"]').value = value;
      select.querySelector('#level-value').textContent = value;
      select.querySelectorAll('[data-select-option]').forEach(option => {
        option.setAttribute('aria-selected', String(option === target));
      });
      setSignupSelectOpen(select, false);
      select.querySelector('[data-select-trigger]').focus();
    } else if (target.dataset.openConversation) {
      selectedConversationId = target.dataset.openConversation;
      page = 'messages';
      history.replaceState(null, '', '#messages');
      await render(false);
    } else if (target.dataset.startConversation) {
      const conversation = await startConversation(user.id, target.dataset.startConversation);
      selectedConversationId = conversation.id;
      page = 'messages';
      history.replaceState(null, '', '#messages');
      await render(false);
      notify(conversation.recipientStatus === 'pending'
        ? 'Message request sent. You can chat after it is approved.'
        : 'Conversation opened.');
    } else if (target.dataset.requestResponse) {
      await respondToConversationRequest(user.id, target.dataset.conversationId, target.dataset.requestResponse === 'accept');
      selectedConversationId = target.dataset.conversationId;
      await render(false);
      notify(target.dataset.requestResponse === 'accept' ? 'Message request accepted.' : 'Message request declined.');
    } else if (target.dataset.page) {
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
        pendingConfirmationEmail = String(data.get('email')).trim().toLowerCase();
        sessionStorage.setItem('bright-path:confirmation-email', pendingConfirmationEmail);
        page = 'confirm';
        history.replaceState(null, '', '#confirm');
        await render();
        notify('Check your email for a 6-digit confirmation code.');
        return;
      }
      user = authResult.user;
      loadUserTheme(user.id);
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
  if (form.id === 'confirm-email-form') {
    event.preventDefault();
    const data = new FormData(form);
    try {
      user = await confirmEmail({ email: data.get('email'), token: data.get('token') });
      pendingConfirmationEmail = '';
      sessionStorage.removeItem('bright-path:confirmation-email');
      const requestedPage = sessionStorage.getItem('bright-path:return-to') || 'home';
      sessionStorage.removeItem('bright-path:return-to');
      page = requestedPage;
      history.replaceState(null, '', `#${page}`);
      await render();
      notify(`Welcome to Bright Path, ${user.name}!`);
    } catch (error) {
      notify(error.message || 'We could not confirm your email. Check the code and try again.');
    }
    if (form.id === 'learner-search-form') {
      event.preventDefault();
      learnerSearch = String(new FormData(form).get('search') || '').trim();
      try {
        learnerSearchResults = await searchLearners(learnerSearch);
        await render(false);
      } catch (error) {
        notify(error.message || 'Could not search learners.');
      }
    }
  }
  if (form.id === 'create-form') {
    event.preventDefault();
    try { await createContent(form); }
    catch (error) { notify(error.message || 'Could not save your contribution.'); }
  }
  if (form.id === 'chat-message-form') {
    event.preventDefault();
    const text = String(new FormData(form).get('text')).trim();
    if (!text) return;
    try {
      await sendChatMessage(user.id, selectedConversationId, text);
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
  if (form.id === 'settings-form') {
    event.preventDefault();
    const data = new FormData(form);
    try {
      const settings = await updateProfile(user.id, {
        isPublic: data.get('isPublic') === 'on',
        theme: data.get('theme')
      });
      applyTheme(settings.theme);
      await render(false);
      notify('Settings saved.');
    } catch (error) {
      notify(error.message || 'Could not save your settings.');
    }
  }
});

document.addEventListener('input', event => {
  if (event.target.id === 'password') updatePasswordStrength(event.target.value);
  if (event.target.id === 'page-search' || event.target.id === 'global-search') preserveSearch(event.target);
});

document.addEventListener('keydown', event => {
  const select = document.querySelector('[data-signup-select]');
  if (select?.classList.contains('is-open')) {
    const options = [...select.querySelectorAll('[data-select-option]')];
    const currentIndex = options.indexOf(document.activeElement);
    let nextIndex = currentIndex;
    if (event.key === 'ArrowDown') nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % options.length;
    else if (event.key === 'ArrowUp') nextIndex = currentIndex < 0 ? options.length - 1 : (currentIndex - 1 + options.length) % options.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = options.length - 1;
    else if (event.key === 'Escape') {
      setSignupSelectOpen(select, false);
      select.querySelector('[data-select-trigger]').focus();
    } else if (event.key === 'Tab') setSignupSelectOpen(select, false);
    if (nextIndex !== currentIndex && nextIndex >= 0) {
      event.preventDefault();
      options[nextIndex].focus();
    }
  } else if (event.key === 'ArrowDown' && event.target.matches('[data-select-trigger]')) {
    event.preventDefault();
    setSignupSelectOpen(select, true, true);
  }
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
if (user) loadUserTheme(user.id);
render();

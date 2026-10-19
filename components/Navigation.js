import { icon } from './Icons.js';

export const brand = `<a class="brand" href="#home" data-page="home" aria-label="Bright Path home"><span class="brand-mark"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M7 27h18M10 26c0-6 2-9 6-12s6-5 6-9M12 21l-5-2m10-4-5-2" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle class="brand-sun" cx="23" cy="6" r="2.5"/></svg></span><span>Bright Path</span></a>`;

const links = [['Home', 'home'], ['Resources', 'resources'], ['Study Groups', 'groups'], ['Q&A', 'qa'], ['Community', 'community']];
const sideLinks = [['home', 'Home', 'home'], ['resources', 'Resources', 'resources'], ['groups', 'Study Groups', 'groups'], ['questions', 'Questions & Answers', 'qa'], ['community', 'Community', 'community'], ['ai', 'AI Learning Hub', 'ai'], ['messages', 'Messages', 'messages'], ['notifications', 'Notifications', 'notifications']];
const mobilePrimaryLinks = [['home', 'Home', 'home'], ['groups', 'Groups', 'groups'], ['messages', 'Messages', 'messages'], ['questions', 'Q&A', 'qa']];
const mobileMoreLinks = [['resources', 'Resources', 'resources'], ['community', 'Community', 'community'], ['ai', 'AI Learning Hub', 'ai'], ['notifications', 'Notifications', 'notifications'], ['profile', 'My profile', 'profile'], ['settings', 'Settings', 'settings']];

export function publicHeader() {
  const currentPage = location.hash.slice(1) || 'home';
  const navLinks = links.map(([label, page]) => `<a class="${currentPage === page ? 'active' : ''}" href="#${page}" data-page="${page}" ${currentPage === page ? 'aria-current="page"' : ''}>${label}</a>`).join('');
  return `<nav class="landing-nav" aria-label="Main navigation">${brand}<div class="landing-links">${navLinks}</div><div class="landing-actions"><a class="text-link" href="#login" data-page="login">Log in</a><a class="btn btn-sm" href="#signup" data-page="signup">Sign Up</a><button class="public-nav-toggle" type="button" data-public-menu aria-expanded="false" aria-controls="landing-mobile-links" aria-label="Open navigation">☰</button></div><div class="landing-mobile-links" id="landing-mobile-links" hidden>${navLinks}</div></nav>`;
}

export function appShell(content, user, animate = true) {
  const userInitial = escapeText(user.name?.[0] || '');
  const profileAvatar = user.avatarUrl
    ? `<span class="profile-mini-initial">${userInitial}</span><img src="${escapeText(user.avatarUrl)}" alt="" aria-hidden="true" data-avatar-image>`
    : userInitial;
  const currentPage = location.hash.slice(1);
  const morePages = mobileMoreLinks.map(([, , page]) => page);
  const sidebarLinks = sideLinks.map(([iconName, label, page]) => `<a class="side-link ${currentPage === page ? 'active' : ''}" href="#${page}" data-page="${page}" title="${label}" ${currentPage === page ? 'aria-current="page"' : ''}><span class="side-icon">${icon(iconName)}</span><span>${label}</span></a>`).join('');
  return `<div class="app-shell"><header class="topbar">${brand}<div class="topbar-right"><form class="searchbox" id="global-search-form" role="search"><label class="sr-only" for="global-search">Search learning resources</label><input id="global-search" name="search" type="search" placeholder="Search resources..." aria-label="Search learning resources" autocomplete="off"></form><button class="icon-button" data-page="messages" aria-label="Messages">${icon('messages')}</button><button class="icon-button" data-page="notifications" aria-label="Notifications">${icon('notifications')}</button><button class="profile-mini" data-page="profile" aria-label="Your profile">${profileAvatar}</button></div></header><div class="app-body"><aside class="sidebar"><nav class="sidebar-navigation" aria-label="Your learning community">${sidebarLinks}</nav><div class="sidebar-tip"><strong>✦ Learn with intention</strong>Use AI as a tool, not a crutch. Keep your curiosity at the heart of learning.</div><div class="sidebar-account"><a class="side-link ${currentPage === 'profile' ? 'active' : ''}" href="#profile" data-page="profile" ${currentPage === 'profile' ? 'aria-current="page"' : ''}><span class="side-icon">${icon('profile')}</span><span>My profile</span></a><a class="side-link ${currentPage === 'settings' ? 'active' : ''}" href="#settings" data-page="settings" ${currentPage === 'settings' ? 'aria-current="page"' : ''}><span class="side-icon">${icon('settings')}</span><span>Settings</span></a><button class="side-link" type="button" data-action="logout"><span class="side-icon">${icon('logout')}</span><span>Log out</span></button></div></aside><main class="main-content ${animate ? 'page-enter' : ''}" data-page="${escapeText(currentPage)}">${content}</main></div><nav class="mobile-island" aria-label="Main navigation"><div class="mobile-island-menu" id="mobile-island-menu" hidden>${mobileMoreLinks.map(([iconName, label, page]) => `<a class="mobile-island-menu-link ${currentPage === page ? 'active' : ''}" href="#${page}" data-page="${page}"><span>${icon(iconName, 19)}</span><span>${label}</span></a>`).join('')}</div><div class="mobile-island-dock">${mobilePrimaryLinks.map(([iconName, label, page]) => `<a class="mobile-island-link ${currentPage === page ? 'active' : ''}" href="#${page}" data-page="${page}" aria-label="${label}" ${currentPage === page ? 'aria-current="page"' : ''}><span class="mobile-island-icon">${icon(iconName, 19)}</span><span class="mobile-island-label">${label}</span></a>`).join('')}<button class="mobile-island-more ${morePages.includes(currentPage) ? 'active' : ''}" type="button" data-mobile-more aria-expanded="false" aria-controls="mobile-island-menu" aria-label="More pages"><span class="mobile-island-icon">${icon('more', 19)}</span><span class="mobile-island-label">More</span></button></div></nav></div>`;
}

export function learnerAvatar(name, avatarUrl = '', className = '') {
  const initials = String(name || 'Learner')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0] || '')
    .join('')
    .toUpperCase();
  return `<span class="message-avatar ${className}" aria-hidden="true"><span>${escapeText(initials)}</span>${avatarUrl ? `<img src="${escapeText(avatarUrl)}" alt="" loading="lazy" decoding="async" data-avatar-image>` : ''}</span>`;
}

export function escapeText(value = '') {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

export function emptyState(title, message, action = '') {
  return `<div class="empty-state"><div class="feature-icon">✦</div><strong>${escapeText(title)}</strong><p>${escapeText(message)}</p>${action}</div>`;
}

export function pageSearch(placeholder) {
  return `<div class="content-toolbar"><div class="content-search"><input id="page-search" placeholder="${escapeText(placeholder)}"></div></div>`;
}

export const brand = `<a class="brand" href="#home" data-page="home" aria-label="Bright Path home"><span class="brand-mark"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 27V13M16 18C8 18 5 13 6 6c7 0 11 3 10 10Zm0-4c0-7 4-11 11-11 0 7-3 11-11 11Z" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 27h16" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></span><span>Bright Path</span></a>`;

const links = [['Home', 'home'], ['Resources', 'resources'], ['Study Groups', 'groups'], ['Q&A', 'qa'], ['Community', 'community']];
const sideLinks = [['⌂', 'Home', 'home'], ['▣', 'Resources', 'resources'], ['♧', 'Study Groups', 'groups'], ['?', 'Questions & Answers', 'qa'], ['◉', 'Community', 'community'], ['✦', 'AI Learning Hub', 'ai'], ['✉', 'Messages', 'messages'], ['♧', 'Notifications', 'notifications']];
const mobilePrimaryLinks = [['⌂', 'Home', 'home'], ['♧', 'Groups', 'groups'], ['✉', 'Messages', 'messages'], ['?', 'Q&A', 'qa']];
const mobileMoreLinks = [['▣', 'Resources', 'resources'], ['◉', 'Community', 'community'], ['✦', 'AI Learning Hub', 'ai'], ['♧', 'Notifications', 'notifications'], ['●', 'My profile', 'profile'], ['⚙', 'Settings', 'settings']];

export function publicHeader() {
  const currentPage = location.hash.slice(1) || 'home';
  const navLinks = links.map(([label, page]) => `<a class="${currentPage === page ? 'active' : ''}" href="#${page}" data-page="${page}" ${currentPage === page ? 'aria-current="page"' : ''}>${label}</a>`).join('');
  return `<nav class="landing-nav" aria-label="Main navigation">${brand}<div class="landing-links">${navLinks}</div><div class="landing-actions"><a class="text-link" href="#login" data-page="login">Log in</a><a class="btn btn-sm" href="#signup" data-page="signup">Sign Up</a><button class="public-nav-toggle" type="button" data-public-menu aria-expanded="false" aria-controls="landing-mobile-links" aria-label="Open navigation">☰</button></div><div class="landing-mobile-links" id="landing-mobile-links" hidden>${navLinks}</div></nav>`;
}

export function appShell(content, user, animate = true) {
  const userInitial = escapeText(user.name?.[0] || '');
  const currentPage = location.hash.slice(1);
  const morePages = mobileMoreLinks.map(([, , page]) => page);
  const sidebarLinks = sideLinks.map(([icon, label, page]) => `<a class="side-link ${currentPage === page ? 'active' : ''}" href="#${page}" data-page="${page}" title="${label}" ${currentPage === page ? 'aria-current="page"' : ''}><span class="side-icon" aria-hidden="true">${icon}</span><span>${label}</span></a>`).join('');
  return `<div class="app-shell"><header class="topbar">${brand}<div class="topbar-right"><div class="searchbox"><input id="global-search" placeholder="Search Bright Path..." aria-label="Search Bright Path"></div><button class="icon-button" data-page="messages" aria-label="Messages">✉</button><button class="icon-button" data-page="notifications" aria-label="Notifications">♧</button><button class="profile-mini" data-page="profile" aria-label="Your profile">${userInitial}</button></div></header><div class="app-body"><aside class="sidebar"><nav class="sidebar-navigation" aria-label="Your learning community">${sidebarLinks}</nav><div class="sidebar-tip"><strong>✦ Learn with intention</strong>Use AI as a tool, not a crutch. Keep your curiosity at the heart of learning.</div><div class="sidebar-account"><a class="side-link ${currentPage === 'profile' ? 'active' : ''}" href="#profile" data-page="profile" ${currentPage === 'profile' ? 'aria-current="page"' : ''}><span class="side-icon" aria-hidden="true">●</span><span>My profile</span></a><a class="side-link ${currentPage === 'settings' ? 'active' : ''}" href="#settings" data-page="settings" ${currentPage === 'settings' ? 'aria-current="page"' : ''}><span class="side-icon" aria-hidden="true">⚙</span><span>Settings</span></a><button class="side-link" data-action="logout"><span class="side-icon" aria-hidden="true">↪</span><span>Log out</span></button></div></aside><main class="main-content ${animate ? 'page-enter' : ''}">${content}</main></div><nav class="mobile-island" aria-label="Main navigation"><div class="mobile-island-menu" id="mobile-island-menu" hidden>${mobileMoreLinks.map(([icon, label, page]) => `<a class="mobile-island-menu-link ${currentPage === page ? 'active' : ''}" href="#${page}" data-page="${page}"><span aria-hidden="true">${icon}</span><span>${label}</span></a>`).join('')}</div><div class="mobile-island-dock">${mobilePrimaryLinks.map(([icon, label, page]) => `<a class="mobile-island-link ${currentPage === page ? 'active' : ''}" href="#${page}" data-page="${page}" aria-label="${label}" ${currentPage === page ? 'aria-current="page"' : ''}><span class="mobile-island-icon" aria-hidden="true">${icon}</span><span class="mobile-island-label">${label}</span></a>`).join('')}<button class="mobile-island-more ${morePages.includes(currentPage) ? 'active' : ''}" type="button" data-mobile-more aria-expanded="false" aria-controls="mobile-island-menu" aria-label="More pages"><span class="mobile-island-icon" aria-hidden="true">•••</span><span class="mobile-island-label">More</span></button></div></nav></div>`;
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

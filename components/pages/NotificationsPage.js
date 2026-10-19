import { listNotifications } from '../../services/notificationApi.js';
import { emptyState, escapeText } from '../Navigation.js';
import { icon } from '../Icons.js';

export async function NotificationsPage(user, view = 'all') {
  const notifications = await listNotifications(user.id);
  const unreadCount = notifications.filter(item => !item.read).length;
  const visible = view === 'unread' ? notifications.filter(item => !item.read) : notifications;
  const content = visible.length
    ? visible.map(item => `<article class="notice notification-card ${item.read ? 'is-read' : 'is-unread'}">
        <div class="feature-icon notification-icon">${icon('notifications', 20)}</div>
        <div class="notification-copy"><strong>${escapeText(item.title)}</strong><p>${escapeText(item.message || '')}</p><time datetime="${escapeText(item.createdAt)}">${escapeText(new Date(item.createdAt).toLocaleString())}</time></div>
        <span class="notice-status" aria-label="${item.read ? 'Read notification' : 'Unread notification'}">${item.read ? 'Read' : 'Unread'}</span>
      </article>`).join('')
    : emptyState(view === 'unread' ? "You're all caught up." : 'No notifications yet', view === 'unread' ? 'There are no unread updates right now.' : 'Updates about your Bright Path activity will appear here.');
  const tabs = [['all', `All <span>${notifications.length}</span>`], ['unread', `Unread <span>${unreadCount}</span>`]];
  return `<div class="welcome-row"><div><span class="eyebrow">Stay up to date</span><h1>Notifications</h1><p>Updates from your Bright Path activity.</p></div>${unreadCount ? '<button class="btn btn-light btn-sm" data-action="mark-read">Mark all as read</button>' : ''}</div>
    <div class="filter-tabs notification-tabs" role="tablist" aria-label="Notification views">${tabs.map(([id, label]) => `<button id="notification-tab-${id}" type="button" class="filter-tab ${view === id ? 'active' : ''}" data-notification-view="${id}" role="tab" aria-controls="notification-panel" aria-selected="${view === id}" tabindex="${view === id ? '0' : '-1'}">${label}</button>`).join('')}</div>
    <section class="panel notification-list" id="notification-panel" role="tabpanel" aria-labelledby="notification-tab-${view}"><div class="panel-head"><h2>${view === 'unread' ? 'Unread updates' : 'All updates'}</h2><span class="view-all">${visible.length} ${visible.length === 1 ? 'notification' : 'notifications'}</span></div>${content}</section>`;
}

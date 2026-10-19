import { listNotifications } from '../../services/notificationApi.js';
import { emptyState, escapeText } from '../Navigation.js';
export async function NotificationsPage(user) {
  const notifications = await listNotifications(user.id);
  const unreadCount = notifications.filter(item => !item.read).length;
  const content = notifications.length
    ? notifications.map(item => `<article class="notice ${item.read ? 'is-read' : 'is-unread'}"><div class="feature-icon" aria-hidden="true">♧</div><div><strong>${escapeText(item.title)}</strong><p>${escapeText(item.message || '')}</p><small>${new Date(item.createdAt).toLocaleString()}</small></div><span class="notice-status">${item.read ? 'Read' : 'New'}</span></article>`).join('')
    : emptyState('No notifications yet', 'Updates about your activity will appear here.');
  const action = unreadCount
    ? '<button class="btn btn-light btn-sm" data-action="mark-read">Mark all as read</button>'
    : '';
  return `<div class="welcome-row"><div><h1>Notifications</h1><p>Updates about your Bright Path activity.</p></div>${action}</div><section class="panel">${content}</section>`;
}

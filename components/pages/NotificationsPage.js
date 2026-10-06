import { listNotifications } from '../../api/notificationApi.js';
import { emptyState, escapeText } from '../Navigation.js';
export async function NotificationsPage(user) {
  const notifications = await listNotifications(user.id);
  const content = notifications.length ? notifications.map(item => `<article class="notice"><div class="feature-icon">♧</div><div><strong>${escapeText(item.title)}</strong><p>${escapeText(item.message || '')}</p><small>${new Date(item.createdAt).toLocaleString()}</small></div></article>`).join('') : emptyState('No notifications yet', 'Updates about your activity will appear here.');
  return `<div class="welcome-row"><div><h1>Notifications</h1><p>Updates about your Bright Path activity.</p></div>${notifications.length ? '<button class="btn btn-light btn-sm" data-action="mark-read">Mark all as read</button>' : ''}</div><section class="panel">${content}</section>`;
}

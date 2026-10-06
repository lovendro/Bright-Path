import { listMessages } from '../../services/messageApi.js';
import { emptyState } from '../Navigation.js';
export async function MessagesPage(user) {
  const messages = await listMessages(user.id);
  const content = messages.length ? messages.map(message => `<div class="bubble ${message.senderId === user.id ? 'mine' : ''}">${message.text}</div>`).join('') : emptyState('No messages yet', 'Messages will appear here when you start a conversation with another learner.');
  return `<div class="welcome-row"><div><h1>Messages</h1><p>Your one-to-one and study group conversations.</p></div></div><section class="panel messages-panel"><div class="panel-head"><h2>Your conversations</h2></div><div class="thread-body">${content}</div><form id="message-form" class="message-compose"><input id="message-input" name="text" placeholder="Write a message" required maxlength="2000"><button class="btn btn-sm" type="submit">Send</button></form></section>`;
}

import {
  listConversationMessages,
  listConversations
} from '../../services/messageApi.js';
import { emptyState, escapeText } from '../Navigation.js';

export async function MessagesPage(user, selectedConversationId = '', searchResults = [], learnerSearch = '') {
  const conversations = await listConversations(user.id);
  const selected = conversations.find(conversation => conversation.id === selectedConversationId);
  const messages = selected &&
    selected.myStatus === 'accepted' && selected.otherStatus === 'accepted'
    ? await listConversationMessages(user.id, selected.id)
    : [];
  const requestRows = conversations
    .filter(conversation => conversation.myStatus === 'pending')
    .map(conversation => `<article class="message-request"><div><strong>${escapeText(conversation.otherName)}</strong><p>Would like to start a conversation with you.</p></div><div class="request-actions"><button class="btn btn-sm" data-request-response="accept" data-conversation-id="${escapeText(conversation.id)}">Accept</button><button class="btn btn-light btn-sm" data-request-response="reject" data-conversation-id="${escapeText(conversation.id)}">Decline</button></div></article>`)
    .join('');
  const contactRows = conversations
    .filter(conversation => conversation.myStatus !== 'pending')
    .map(conversation => `<button class="conversation-link ${selected?.id === conversation.id ? 'active' : ''}" type="button" data-open-conversation="${escapeText(conversation.id)}"><strong>${escapeText(conversation.otherName)}</strong><span>${conversation.otherStatus === 'pending' ? 'Request sent' : conversation.otherStatus === 'rejected' ? 'Request declined' : 'Open conversation'}</span></button>`)
    .join('');
  const learnerRows = searchResults.length
    ? searchResults.map(learner => `<article class="learner-result"><div><strong>${escapeText(learner.full_name || 'Learner')}</strong><p>${escapeText(learner.level || 'Learner')} · ${learner.is_public ? 'Public account' : 'Private account'}</p></div><button class="btn btn-sm" type="button" data-start-conversation="${escapeText(learner.id)}">Message</button></article>`).join('')
    : learnerSearch ? '<p class="settings-hint">No learners found. Try another name.</p>' : '';

  let thread;
  if (!selected) {
    thread = emptyState('Choose a conversation', 'Start a conversation with another learner or select one from your inbox.');
  } else if (selected.myStatus === 'pending') {
    thread = `<div class="request-preview"><strong>${escapeText(selected.otherName)}</strong><p>This learner sent you a message request. Accept it to start chatting, or decline it.</p><div class="request-actions"><button class="btn btn-sm" data-request-response="accept" data-conversation-id="${escapeText(selected.id)}">Accept request</button><button class="btn btn-light btn-sm" data-request-response="reject" data-conversation-id="${escapeText(selected.id)}">Decline</button></div></div>`;
  } else if (selected.otherStatus === 'pending') {
    thread = `<div class="request-preview"><strong>Message request sent</strong><p>Your request to ${escapeText(selected.otherName)} is waiting for approval.</p></div>`;
  } else if (selected.otherStatus === 'rejected') {
    thread = `<div class="request-preview"><strong>Request declined</strong><p>${escapeText(selected.otherName)} declined this message request.</p></div>`;
  } else {
    const messageRows = messages.map(message => `<div class="bubble ${message.senderId === user.id ? 'mine' : ''}">${escapeText(message.text)}</div>`).join('');
    thread = `<div class="thread-body">${messageRows || '<p class="settings-hint">No messages yet. Say hello.</p>'}</div><form id="chat-message-form" class="message-compose"><input id="message-input" name="text" placeholder="Write a message" required maxlength="2000" autocomplete="off"><button class="btn btn-sm" type="submit">Send</button></form>`;
  }

  return `<div class="welcome-row"><div><h1>Messages</h1><p>Chat with other Bright Path learners.</p></div></div><div class="messages-layout"><aside class="panel messages-inbox"><section><h2>Find a learner</h2><form id="learner-search-form" class="learner-search"><input class="field" name="search" value="${escapeText(learnerSearch)}" placeholder="Search by name" maxlength="80"><button class="btn btn-sm" type="submit">Search</button></form>${learnerRows}</section><section><h2>Message requests</h2>${requestRows || '<p class="settings-hint">No pending requests.</p>'}</section><section><h2>Conversations</h2>${contactRows || '<p class="settings-hint">No conversations yet.</p>'}</section></aside><section class="panel messages-panel"><div class="panel-head"><h2>${selected ? escapeText(selected.otherName) : 'Your conversation'}</h2></div>${thread}</section></div>`;
}

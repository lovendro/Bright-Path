import {
  listConversationMessages,
  listConversations
} from '../../services/messageApi.js';
import { listCallHistory } from '../../services/callApi.js';
import { isSupabaseConfigured } from '../../services/supabaseConfig.js';
import { emptyState, escapeText } from '../Navigation.js';

function initials(name) {
  return String(name || 'Learner')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0] || '')
    .join('')
    .toUpperCase();
}

function avatar(name, className = '') {
  return `<span class="message-avatar ${className}" aria-hidden="true">${escapeText(initials(name))}</span>`;
}

export async function MessagesPage(user, selectedConversationId = '', searchResults = [], learnerSearch = '') {
  const conversations = await listConversations(user.id);
  const callHistory = isSupabaseConfigured ? await listCallHistory(user.id) : [];
  const selected = conversations.find(conversation => conversation.id === selectedConversationId);
  const messages = selected &&
    selected.myStatus === 'accepted' && selected.otherStatus === 'accepted'
    ? await listConversationMessages(user.id, selected.id)
    : [];
  const requestRows = conversations
    .filter(conversation => conversation.myStatus === 'pending')
    .map(conversation => `<article class="message-request">${avatar(conversation.otherName)}<div class="message-request-copy"><strong>${escapeText(conversation.otherName)}</strong><p>Would like to start a conversation with you.</p></div><div class="request-actions"><button class="btn btn-sm" data-request-response="accept" data-conversation-id="${escapeText(conversation.id)}">Accept</button><button class="btn btn-light btn-sm" data-request-response="reject" data-conversation-id="${escapeText(conversation.id)}">Decline</button></div></article>`)
    .join('');
  const contactRows = conversations
    .filter(conversation => conversation.myStatus !== 'pending')
    .map(conversation => {
      const status = conversation.myStatus === 'rejected' ? 'Request declined by you' : conversation.otherStatus === 'pending' ? 'Request sent' : conversation.otherStatus === 'rejected' ? 'Request declined' : 'Open conversation';
      return `<button class="conversation-link ${selected?.id === conversation.id ? 'active' : ''}" type="button" data-open-conversation="${escapeText(conversation.id)}">${avatar(conversation.otherName)}<span class="conversation-copy"><strong>${escapeText(conversation.otherName)}</strong><span>${escapeText(status)}</span></span><span class="conversation-chevron" aria-hidden="true">›</span></button>`;
    })
    .join('');
  const learnerRows = searchResults.length
    ? searchResults.map(learner => `<article class="learner-result">${avatar(learner.full_name || 'Learner')}<div class="learner-result-copy"><strong>${escapeText(learner.full_name || 'Learner')}</strong><p>${escapeText(learner.level || 'Learner')} · ${learner.is_public ? 'Public account' : 'Private account'}</p></div><button class="btn btn-sm" type="button" data-start-conversation="${escapeText(learner.id)}">Message</button></article>`).join('')
    : learnerSearch ? '<p class="settings-hint">No learners found. Try another name.</p>' : '';
  const callRows = callHistory.map(call => {
    const otherUserId = call.callerId === user.id ? call.calleeId : call.callerId;
    const otherName = conversations.find(conversation => conversation.otherUserId === otherUserId)?.otherName || 'Learner';
    const status = ({ missed: 'No answer', rejected: 'Declined', ended: 'Ended', accepted: 'Connected', ringing: 'Ringing' })[call.status] || 'Call';
    return `<article class="call-history-row"><div><strong>${escapeText(otherName)}</strong><span>${call.callerId === user.id ? 'Outgoing' : 'Incoming'} ${call.isVideo ? 'video' : 'audio'} · ${status}</span></div><time>${new Date(call.createdAt).toLocaleDateString()}</time></article>`;
  }).join('');

  let thread;
  if (!selected) {
    thread = emptyState('Choose a conversation', 'Start a conversation with another learner or select one from your inbox.');
  } else if (selected.myStatus === 'pending') {
    thread = `<div class="request-preview"><strong>${escapeText(selected.otherName)}</strong><p>This learner sent you a message request. Accept it to start chatting, or decline it.</p><div class="request-actions"><button class="btn btn-sm" data-request-response="accept" data-conversation-id="${escapeText(selected.id)}">Accept request</button><button class="btn btn-light btn-sm" data-request-response="reject" data-conversation-id="${escapeText(selected.id)}">Decline</button></div></div>`;
  } else if (selected.myStatus === 'rejected') {
    thread = '<div class="request-preview"><strong>Request declined</strong><p>You declined this message request. This conversation is closed.</p></div>';
  } else if (selected.otherStatus === 'pending') {
    thread = `<div class="request-preview"><strong>Message request sent</strong><p>Your request to ${escapeText(selected.otherName)} is waiting for approval.</p></div>`;
  } else if (selected.otherStatus === 'rejected') {
    thread = `<div class="request-preview"><strong>Request declined</strong><p>${escapeText(selected.otherName)} declined this message request.</p></div>`;
  } else {
    const messageRows = messages.map(message => `<article class="bubble ${message.senderId === user.id ? 'mine' : ''}" data-message-id="${escapeText(message.id)}"><p>${escapeText(message.text)}</p><time datetime="${escapeText(message.createdAt)}">${escapeText(new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))}</time></article>`).join('');
    thread = `<div class="thread-body" role="log" aria-label="Conversation with ${escapeText(selected.otherName)}" aria-live="polite" aria-relevant="additions text" data-latest-at="${escapeText(messages.at(-1)?.createdAt || '')}">${messageRows || '<div class="chat-empty"><span aria-hidden="true">✦</span><strong>Start the conversation</strong><p>Say hello and share what you are learning.</p></div>'}</div><form id="chat-message-form" class="message-compose"><label class="sr-only" for="message-input">Write a message</label><input id="message-input" name="text" placeholder="Write a message…" required maxlength="2000" autocomplete="off" aria-label="Write a message"><button class="btn btn-sm" type="submit" aria-label="Send message"><span>Send</span><span aria-hidden="true">➤</span></button></form>`;
  }

  const reviewButton = selected?.myStatus === 'accepted' && selected.otherStatus === 'accepted'
    ? `<div class="message-header-actions"><button class="btn btn-light btn-sm" data-review-type="profile" data-review-target="${escapeText(selected.otherUserId)}" data-review-name="${escapeText(selected.otherName)}">Review profile</button><button class="btn btn-light btn-sm" data-start-call="audio" aria-label="Start audio call">☎ <span>Audio</span></button><button class="btn btn-light btn-sm" data-start-call="video" aria-label="Start video call">▣ <span>Video</span></button></div>`
    : '';
  const pendingCount = conversations.filter(conversation => conversation.myStatus === 'pending').length;
  const acceptedCount = conversations.filter(conversation => conversation.myStatus !== 'pending').length;
  const header = selected
    ? `<div class="message-thread-heading">${avatar(selected.otherName, 'message-avatar-large')}<div><h2>${escapeText(selected.otherName)}</h2><p>${selected.myStatus === 'accepted' && selected.otherStatus === 'accepted' ? 'Bright Path learner' : 'Message request'}</p></div></div>${reviewButton}`
    : `<div class="message-thread-heading"><span class="message-thread-icon" aria-hidden="true">✉</span><div><h2>Your conversations</h2><p>Select a learner to open your chat.</p></div></div>`;
  return `<div class="welcome-row messages-welcome"><div><h1>Messages</h1><p>Keep your learning conversations in one place.</p></div><span class="messages-welcome-mark" aria-hidden="true">✉</span></div><div class="messages-layout"><aside class="panel messages-inbox"><section class="inbox-search-section"><div class="messages-section-heading"><h2>Find a learner</h2><span class="messages-section-icon" aria-hidden="true">⌕</span></div><form id="learner-search-form" class="learner-search"><input class="field" name="search" value="${escapeText(learnerSearch)}" placeholder="Search by name" maxlength="80" aria-label="Search learners"><button class="btn btn-sm" type="submit">Search</button></form>${learnerRows}</section><section class="inbox-requests"><div class="messages-section-heading"><h2>Message requests</h2><span class="message-count ${pendingCount ? 'has-items' : ''}">${pendingCount}</span></div>${requestRows || '<p class="settings-hint">No pending requests.</p>'}</section><section class="inbox-conversations"><div class="messages-section-heading"><h2>Conversations</h2><span class="message-count">${acceptedCount}</span></div>${contactRows || '<p class="settings-hint">No conversations yet.</p>'}</section><section class="inbox-call-history"><div class="messages-section-heading"><h2>Recent calls</h2></div>${callRows || '<p class="settings-hint">No calls yet.</p>'}</section></aside><section class="panel messages-panel"><div class="messages-panel-head">${header}</div>${thread}</section></div>`;
}

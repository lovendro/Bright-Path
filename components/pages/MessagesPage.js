import {
  listConversationMessages,
  listConversations
} from '../../services/messageApi.js';
import { listCallHistory } from '../../services/callApi.js';
import { getProfileAvatarUrls } from '../../services/profileApi.js';
import { isSupabaseConfigured } from '../../services/supabaseConfig.js';
import { emptyState, escapeText, learnerAvatar } from '../Navigation.js';
import { icon } from '../Icons.js';

export async function MessagesPage(user, selectedConversationId = '', searchResults = [], learnerSearch = '') {
  const conversations = await listConversations(user.id);
  const callHistory = isSupabaseConfigured ? await listCallHistory(user.id) : [];
  const selected = conversations.find(conversation => conversation.id === selectedConversationId);
  const messages = selected &&
    selected.myStatus === 'accepted' && selected.otherStatus === 'accepted'
    ? await listConversationMessages(user.id, selected.id)
    : [];
  const avatarIds = [...new Set([
    ...conversations.map(conversation => conversation.otherUserId),
    ...searchResults.map(learner => learner.id),
    ...messages.map(message => message.senderId),
    ...callHistory.map(call => call.callerId === user.id ? call.calleeId : call.callerId)
  ])];
  const avatarUrls = await getProfileAvatarUrls(avatarIds);
  const avatar = (userId, name, className = '') =>
    learnerAvatar(name, userId === user.id ? user.avatarUrl : avatarUrls[userId] || '', className);
  const requestRows = conversations
    .filter(conversation => conversation.myStatus === 'pending')
    .map(conversation => `<article class="message-request">${avatar(conversation.otherUserId, conversation.otherName)}<div class="message-request-copy"><strong>${escapeText(conversation.otherName)}</strong><p>Would like to start a conversation with you.</p></div><div class="request-actions"><button class="btn btn-sm" data-request-response="accept" data-conversation-id="${escapeText(conversation.id)}">Accept</button><button class="btn btn-light btn-sm" data-request-response="reject" data-conversation-id="${escapeText(conversation.id)}">Decline</button></div></article>`)
    .join('');
  const contactRows = conversations
    .filter(conversation => conversation.myStatus !== 'pending')
    .map(conversation => {
      const status = conversation.myStatus === 'rejected' ? 'Request declined by you' : conversation.otherStatus === 'pending' ? 'Request sent' : conversation.otherStatus === 'rejected' ? 'Request declined' : 'Open conversation';
      return `<button class="conversation-link ${selected?.id === conversation.id ? 'active' : ''}" type="button" data-open-conversation="${escapeText(conversation.id)}">${avatar(conversation.otherUserId, conversation.otherName)}<span class="conversation-copy"><strong>${escapeText(conversation.otherName)}</strong><span>${escapeText(status)}</span></span><span class="conversation-chevron" aria-hidden="true">›</span></button>`;
    })
    .join('');
  const learnerRows = searchResults.length
    ? searchResults.map(learner => `<article class="learner-result">${avatar(learner.id, learner.full_name || 'Learner')}<div class="learner-result-copy"><strong>${escapeText(learner.full_name || 'Learner')}</strong><p>${escapeText(learner.level || 'Learner')} · ${learner.is_public ? 'Public account' : 'Private account'}</p></div><button class="btn btn-sm" type="button" data-start-conversation="${escapeText(learner.id)}">Message</button></article>`).join('')
    : learnerSearch ? '<p class="settings-hint">No learners found. Try another name.</p>' : '';
  const callRows = callHistory.map(call => {
    const otherUserId = call.callerId === user.id ? call.calleeId : call.callerId;
    const otherName = conversations.find(conversation => conversation.otherUserId === otherUserId)?.otherName || 'Learner';
    const status = ({ missed: 'No answer', rejected: 'Declined', ended: 'Ended', accepted: 'Connected', ringing: 'Ringing' })[call.status] || 'Call';
    const direction = call.callerId === user.id ? 'Outgoing' : 'Incoming';
    return `<article class="call-history-row">${avatar(otherUserId, otherName)}<span class="call-history-icon ${call.status === 'missed' ? 'missed' : ''}" aria-hidden="true">${icon(call.isVideo ? 'video' : 'phone', 17)}</span><div class="call-history-details"><strong>${escapeText(otherName)}</strong><span>${direction} ${call.isVideo ? 'video' : 'audio'} · ${status}</span><time datetime="${escapeText(call.createdAt)}">${escapeText(new Date(call.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }))}</time></div><button class="call-history-delete" type="button" data-hide-call="${escapeText(call.id)}" data-call-name="${escapeText(otherName)}" aria-label="Remove call with ${escapeText(otherName)} from your history" title="Remove from your history">×</button></article>`;
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
    const messageRows = messages.map(message => `<article class="bubble ${message.senderId === user.id ? 'mine' : ''}" data-message-id="${escapeText(message.id)}"><div class="bubble-content-row"><p>${escapeText(message.text)}</p>${message.senderId === user.id ? `<div class="message-actions"><button class="message-menu-trigger" type="button" data-message-menu-trigger aria-label="Message options" aria-expanded="false">⋯</button><div class="message-menu" data-message-menu hidden><button type="button" data-message-menu-action="edit" data-message-kind="direct">Edit message</button><button type="button" data-message-menu-action="unsend" data-message-kind="direct">Unsend message</button></div></div>` : ''}</div><time datetime="${escapeText(message.createdAt)}">${escapeText(new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))}</time></article>`).join('');
    thread = `<div class="thread-body" role="log" aria-label="Conversation with ${escapeText(selected.otherName)}" aria-live="polite" aria-relevant="additions text" data-latest-at="${escapeText(messages.at(-1)?.createdAt || '')}">${messageRows || '<div class="chat-empty"><span aria-hidden="true">✦</span><strong>Start the conversation</strong><p>Say hello and share what you are learning.</p></div>'}</div><form id="chat-message-form" class="message-compose"><label class="sr-only" for="message-input">Write a message</label><input id="message-input" name="text" placeholder="Write a message…" required maxlength="2000" autocomplete="off" aria-label="Write a message"><button class="btn btn-sm" type="submit" aria-label="Send message"><span>Send</span>${icon('send', 16)}</button></form>`;
  }

  const reviewButton = selected?.myStatus === 'accepted' && selected.otherStatus === 'accepted'
    ? `<div class="message-header-actions"><button class="btn btn-light btn-sm" data-review-type="profile" data-review-target="${escapeText(selected.otherUserId)}" data-review-name="${escapeText(selected.otherName)}">Review profile</button><button class="btn btn-light btn-sm" data-start-call="audio" aria-label="Start audio call">${icon('phone', 16)} <span>Audio</span></button><button class="btn btn-light btn-sm" data-start-call="video" aria-label="Start video call">${icon('video', 16)} <span>Video</span></button></div>`
    : '';
  const pendingCount = conversations.filter(conversation => conversation.myStatus === 'pending').length;
  const acceptedCount = conversations.filter(conversation => conversation.myStatus !== 'pending').length;
  const header = selected
    ? `<button class="messages-mobile-back" type="button" data-back-messages><span aria-hidden="true">←</span> Back to Messages</button><div class="message-thread-heading">${avatar(selected.otherUserId, selected.otherName, 'message-avatar-large')}<div><h2>${escapeText(selected.otherName)}</h2><p>${selected.myStatus === 'accepted' && selected.otherStatus === 'accepted' ? 'Bright Path learner' : 'Message request'}</p></div></div>${reviewButton}`
    : `<div class="message-thread-heading"><span class="message-thread-icon" aria-hidden="true">${icon('messages')}</span><div><h2>Your conversations</h2><p>Select a learner to open your chat.</p></div></div>`;
  return `<div class="messages-page ${selected ? 'has-chat-open' : ''}"><div class="welcome-row messages-welcome"><div><h1>Messages</h1><p>Keep your learning conversations in one place.</p></div><span class="messages-welcome-mark" aria-hidden="true">${icon('messages', 21)}</span></div><div class="messages-layout ${selected ? 'is-chat-open' : 'is-inbox-open'}"><aside class="panel messages-inbox"><section class="inbox-search-section"><div class="messages-section-heading"><h2>Find a learner</h2><span class="messages-section-icon" aria-hidden="true">${icon('search', 18)}</span></div><form id="learner-search-form" class="learner-search"><input class="field" name="search" value="${escapeText(learnerSearch)}" placeholder="Search by name" maxlength="80" aria-label="Search learners"><button class="btn btn-sm" type="submit">Search</button></form>${learnerRows}</section><section class="inbox-requests"><div class="messages-section-heading"><h2>Message requests</h2><span class="message-count ${pendingCount ? 'has-items' : ''}">${pendingCount}</span></div>${requestRows || '<p class="settings-hint">No pending requests.</p>'}</section><section class="inbox-conversations"><div class="messages-section-heading"><h2>Conversations</h2><span class="message-count">${acceptedCount}</span></div>${contactRows || '<p class="settings-hint">No conversations yet.</p>'}</section><section class="inbox-call-history"><div class="messages-section-heading"><h2>Recent calls</h2>${callHistory.length ? `<button class="call-history-clear" type="button" data-clear-call-history>Clear all</button>` : ''}</div>${callRows || '<p class="settings-hint">Your recent calls will appear here.</p>'}</section></aside><section class="panel messages-panel"><div class="messages-panel-head">${header}</div>${thread}</section></div></div>`;
}

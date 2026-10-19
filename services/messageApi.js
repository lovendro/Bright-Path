import { makeId, readStore, scopedKey, writeStore } from './storage.js';
import { currentUser } from './authApi.js';
import { isSupabaseConfigured } from './supabaseConfig.js';
import { addNotification } from './notificationApi.js';
import { remoteDelete, remoteInsert, remoteRpc, remoteSelect, remoteUpdate } from './supabaseClient.js';

const CONVERSATIONS = 'conversations';
const localMessagesKey = conversationId => scopedKey(conversationId, 'chat-messages');

export async function searchLearners(searchTerm = '') {
  if (isSupabaseConfigured) {
    return remoteRpc('search_learners', { search_term: searchTerm.trim() });
  }
  const viewer = currentUser();
  const accounts = readStore('accounts', []);
  return accounts
    .filter(account => account.id !== viewer?.id && account.name.toLowerCase().includes(searchTerm.trim().toLowerCase()))
    .slice(0, 25)
    .map(account => ({
      id: account.id,
      full_name: account.name,
      level: account.level,
      is_public: Boolean(readStore(scopedKey(account.id, 'profile'), {}).isPublic)
    }));
}

export async function startConversation(userId, targetUserId) {
  if (isSupabaseConfigured) {
    const [result] = await remoteRpc('start_direct_conversation', { target_user_id: targetUserId });
    if (!result?.conversation_id) throw new Error('Could not start a conversation with this learner.');
    return { id: result.conversation_id, recipientStatus: result.recipient_status };
  }
  if (userId === targetUserId) throw new Error('You cannot start a conversation with yourself.');
  const accounts = readStore('accounts', []);
  const target = accounts.find(account => account.id === targetUserId);
  if (!target) throw new Error('That learner could not be found.');
  const conversations = readStore(CONVERSATIONS, []);
  const existing = conversations.find(conversation => conversation.members.some(member => member.userId === userId) &&
    conversation.members.some(member => member.userId === targetUserId));
  if (existing) {
    return {
      id: existing.id,
      recipientStatus: existing.members.find(member => member.userId === targetUserId).status
    };
  }
  const current = accounts.find(account => account.id === userId);
  const targetProfile = readStore(scopedKey(targetUserId, 'profile'), {});
  const targetStatus = targetProfile.isPublic ? 'accepted' : 'pending';
  const conversation = {
    id: makeId(),
    createdAt: new Date().toISOString(),
    members: [
      { userId, displayName: current?.name || 'Learner', status: 'accepted' },
      { userId: targetUserId, displayName: target.name, status: targetStatus }
    ]
  };
  writeStore(CONVERSATIONS, [conversation, ...conversations]);
  if (targetStatus === 'pending') {
    await addNotification(targetUserId, {
      title: 'New message request',
      message: `${current?.name || 'A learner'} would like to start a conversation with you.`
    });
  }
  return { id: conversation.id, recipientStatus: targetStatus };
}

export async function listConversations(userId) {
  if (isSupabaseConfigured) {
    return (await remoteRpc('list_my_conversations', {})).map(row => ({
      id: row.conversation_id,
      createdAt: row.created_at,
      otherUserId: row.other_user_id,
      otherName: row.other_name,
      myStatus: row.my_status,
      otherStatus: row.other_status
    }));
  }
  return readStore(CONVERSATIONS, [])
    .filter(conversation => conversation.members.some(member => member.userId === userId))
    .map(conversation => {
      const own = conversation.members.find(member => member.userId === userId);
      const other = conversation.members.find(member => member.userId !== userId);
      return {
        id: conversation.id,
        createdAt: conversation.createdAt,
        otherUserId: other.userId,
        otherName: other.displayName,
        myStatus: own.status,
        otherStatus: other.status
      };
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function respondToConversationRequest(userId, conversationId, accept) {
  const nextStatus = accept ? 'accepted' : 'rejected';
  if (isSupabaseConfigured) {
    const updated = await remoteUpdate('conversation_members',
      `conversation_id=eq.${encodeURIComponent(conversationId)}&user_id=eq.${encodeURIComponent(userId)}&status=eq.pending`,
      { status: nextStatus });
    if (!updated.length) throw new Error('This message request is no longer pending.');
    return;
  }
  const conversations = readStore(CONVERSATIONS, []);
  const conversation = conversations.find(item => item.id === conversationId);
  const member = conversation?.members.find(item => item.userId === userId);
  if (!member || member.status !== 'pending') throw new Error('This message request is no longer pending.');
  member.status = nextStatus;
  writeStore(CONVERSATIONS, conversations);
}

export async function listConversationMessages(userId, conversationId, after = '') {
  const conversation = (await listConversations(userId)).find(item => item.id === conversationId);
  if (!conversation || conversation.myStatus !== 'accepted' || conversation.otherStatus !== 'accepted') return [];
  if (isSupabaseConfigured) {
    return (await remoteSelect('chat_messages',
      `select=*&conversation_id=eq.${encodeURIComponent(conversationId)}${after ? `&or=${encodeURIComponent(`(created_at.gt.${after},edited_at.gt.${after})`)}` : ''}&order=created_at.asc`))
      .map(row => ({ id: row.id, senderId: row.sender_id, text: row.body, createdAt: row.created_at, editedAt: row.edited_at }));
  }
  const messages = readStore(localMessagesKey(conversationId), []);
  return after ? messages.filter(message => message.createdAt > after || (message.editedAt && message.editedAt > after)) : messages;
}

export async function listConversationMessageIds(userId, conversationId) {
  const conversation = (await listConversations(userId)).find(item => item.id === conversationId);
  if (!conversation || conversation.myStatus !== 'accepted' || conversation.otherStatus !== 'accepted') return [];
  if (isSupabaseConfigured) {
    return (await remoteSelect('chat_messages',
      `select=id&conversation_id=eq.${encodeURIComponent(conversationId)}`)).map(row => row.id);
  }
  return readStore(localMessagesKey(conversationId), []).map(message => message.id);
}

export async function sendChatMessage(userId, conversationId, text) {
  const cleaned = text.trim();
  if (!cleaned || cleaned.length > 2000) throw new Error('Messages must be between 1 and 2,000 characters.');
  const conversation = (await listConversations(userId)).find(item => item.id === conversationId);
  if (!conversation || conversation.myStatus !== 'accepted' || conversation.otherStatus !== 'accepted') {
    throw new Error('This conversation is not approved for messaging.');
  }
  if (isSupabaseConfigured) {
    const [row] = await remoteInsert('chat_messages', {
      conversation_id: conversationId,
      sender_id: userId,
      body: cleaned
    });
    return { id: row.id, senderId: row.sender_id, text: row.body, createdAt: row.created_at };
  }
  const message = { id: makeId(), senderId: userId, text: cleaned, createdAt: new Date().toISOString() };
  writeStore(localMessagesKey(conversationId), [...readStore(localMessagesKey(conversationId), []), message]);
  await addNotification(conversation.otherUserId, {
    title: 'New message',
    message: `${currentUser()?.name || 'A learner'} sent you a message.`
  });
  return message;
}

export async function unsendChatMessage(userId, conversationId, messageId) {
  if (isSupabaseConfigured) {
    const deleted = await remoteDelete('chat_messages',
      `id=eq.${encodeURIComponent(messageId)}&conversation_id=eq.${encodeURIComponent(conversationId)}&sender_id=eq.${encodeURIComponent(userId)}`);
    if (!deleted.length) throw new Error('This message could not be unsent. It may no longer exist or may not belong to you.');
    return;
  }
  const messagesKey = localMessagesKey(conversationId);
  const messages = readStore(messagesKey, []);
  const message = messages.find(item => item.id === messageId);
  if (!message || message.senderId !== userId) {
    throw new Error('This message could not be unsent. It may no longer exist or may not belong to you.');
  }
  writeStore(messagesKey, messages.filter(item => item.id !== messageId));
}

export async function editChatMessage(userId, conversationId, messageId, text) {
  const cleaned = text.trim();
  if (!cleaned || cleaned.length > 2000) throw new Error('Messages must be between 1 and 2,000 characters.');
  if (isSupabaseConfigured) {
    const updated = await remoteUpdate('chat_messages',
      `id=eq.${encodeURIComponent(messageId)}&conversation_id=eq.${encodeURIComponent(conversationId)}&sender_id=eq.${encodeURIComponent(userId)}`,
      { body: cleaned, edited_at: new Date().toISOString() });
    if (!updated.length) throw new Error('This message could not be edited. It may no longer exist or may not belong to you.');
    return;
  }
  const messagesKey = localMessagesKey(conversationId);
  const messages = readStore(messagesKey, []);
  const message = messages.find(item => item.id === messageId);
  if (!message || message.senderId !== userId) {
    throw new Error('This message could not be edited. It may no longer exist or may not belong to you.');
  }
  message.text = cleaned;
  message.editedAt = new Date().toISOString();
  writeStore(messagesKey, messages);
}

import { makeId, readStore, scopedKey, writeStore } from './storage.js';
import { currentUser } from './authApi.js';
import { isSupabaseConfigured } from './supabaseConfig.js';
import { remoteInsert, remoteRpc, remoteSelect, remoteUpdate } from './supabaseClient.js';

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
      `select=*&conversation_id=eq.${encodeURIComponent(conversationId)}${after ? `&created_at=gt.${encodeURIComponent(after)}` : ''}&order=created_at.asc`))
      .map(row => ({ id: row.id, senderId: row.sender_id, text: row.body, createdAt: row.created_at }));
  }
  const messages = readStore(localMessagesKey(conversationId), []);
  return after ? messages.filter(message => message.createdAt > after) : messages;
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
  return message;
}

import { makeId, readStore, scopedKey, writeStore } from './storage.js';
import { isSupabaseConfigured } from './supabaseConfig.js';
import { remoteDelete, remoteInsert, remoteSelect } from './supabaseClient.js';
const key = 'questions';
const fromRemote = row => ({ ...row, authorId: row.author_id, authorName: row.author_name, answerCount: row.answer_count, createdAt: row.created_at });
export async function listQuestions() {
  if (isSupabaseConfigured) return (await remoteSelect('questions', 'select=*&order=created_at.desc')).map(fromRemote);
  return readStore(key, []);
}
export async function createQuestion(userId, input) {
  if (isSupabaseConfigured) {
    const [row] = await remoteInsert('questions', {
      title: input.title, description: input.description, subject: input.subject,
      author_id: userId, author_name: input.authorName
    });
    return fromRemote(row);
  }
  const question = { id: makeId(), ...input, authorId: userId, answerCount: 0, votes: 0, createdAt: new Date().toISOString() };
  writeStore(key, [question, ...readStore(key, [])]);
  return question;
}
export async function voteQuestion(userId, questionId) {
  const voteKey = scopedKey(userId, 'question-votes');
  if (isSupabaseConfigured) {
    const query = `select=question_id&user_id=eq.${encodeURIComponent(userId)}&question_id=eq.${encodeURIComponent(questionId)}`;
    const existing = await remoteSelect('question_votes', query);
    if (existing.length) await remoteDelete('question_votes', `user_id=eq.${encodeURIComponent(userId)}&question_id=eq.${encodeURIComponent(questionId)}`);
    else await remoteInsert('question_votes', { user_id: userId, question_id: questionId });
    return;
  }
  const votes = readStore(voteKey, []);
  const next = votes.includes(questionId) ? votes.filter(id => id !== questionId) : [...votes, questionId];
  writeStore(voteKey, next);
  const questions = listQuestions().map(question => question.id === questionId
    ? { ...question, votes: Math.max(0, question.votes + (next.includes(questionId) ? 1 : -1)) }
    : question);
  writeStore(key, questions);
}

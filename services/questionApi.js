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
export async function listAnswers(questionId) {
  if (isSupabaseConfigured) {
    return (await remoteSelect('question_answers',
      `select=*&question_id=eq.${encodeURIComponent(questionId)}&order=created_at.asc`))
      .map(row => ({ ...row, authorId: row.author_id, authorName: row.author_name, createdAt: row.created_at }));
  }
  return readStore(scopedKey(questionId, 'question-answers'), []);
}
export async function createAnswer(userId, questionId, input) {
  const body = String(input.body || '').trim();
  if (!body || body.length > 3000) throw new Error('Answers must be between 1 and 3,000 characters.');
  if (isSupabaseConfigured) {
    const [row] = await remoteInsert('question_answers', {
      question_id: questionId, author_id: userId, author_name: input.authorName, body
    });
    return { ...row, authorId: row.author_id, authorName: row.author_name, createdAt: row.created_at };
  }
  const answer = {
    id: makeId(), questionId, authorId: userId,
    authorName: input.authorName, body, createdAt: new Date().toISOString()
  };
  const answersKey = scopedKey(questionId, 'question-answers');
  writeStore(answersKey, [...readStore(answersKey, []), answer]);
  writeStore(key, readStore(key, []).map(question => question.id === questionId
    ? { ...question, answerCount: (question.answerCount || 0) + 1 }
    : question));
  return answer;
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
  const questions = readStore(key, []).map(question => question.id === questionId
    ? { ...question, votes: Math.max(0, question.votes + (next.includes(questionId) ? 1 : -1)) }
    : question);
  writeStore(key, questions);
}

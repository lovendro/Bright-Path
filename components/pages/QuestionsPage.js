import { listQuestions } from '../../services/questionApi.js';
import { emptyState, escapeText } from '../Navigation.js';
import { questionRows } from '../PageHelpers.js';
export async function QuestionsPage(_user, query = '') {
  const questions = (await listQuestions()).filter(question => `${question.title} ${question.subject || ''} ${question.description || ''}`.toLowerCase().includes(query.toLowerCase()));
  const body = questions.length ? questionRows(questions) : emptyState(query ? 'No questions found' : 'No questions have been posted', query ? 'Try a different search.' : 'Ask the first question and let the community grow around it.', '<button class="btn btn-sm" data-modal="question">＋ Ask the first question</button>');
  return `<div class="welcome-row"><div><h1>Questions & Answers</h1><p>Ask for help, share what you know, and learn together.</p></div><button class="btn btn-sm" data-modal="question">＋ Ask a Question</button></div><div class="content-toolbar"><div class="content-search"><input id="page-search" placeholder="Search questions" value="${escapeText(query)}"></div></div><section class="panel"><div class="panel-head"><h2>Community questions</h2><span class="view-all">${questions.length} ${questions.length === 1 ? 'question' : 'questions'}</span></div>${body}</section>`;
}

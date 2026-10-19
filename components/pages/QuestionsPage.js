import { listAnswers, listQuestions } from '../../services/questionApi.js';
import { emptyState, escapeText } from '../Navigation.js';

const tabs = [['recent', 'Recent'], ['unanswered', 'Unanswered'], ['trending', 'Trending'], ['mine', 'My Questions']];

function questionCard(question) {
  const answerCount = Number(question.answerCount || 0);
  return `<article class="question-card question-card-compact accent-amber">
    <div class="question-card-stats"><span><strong>${answerCount}</strong> ${answerCount === 1 ? 'answer' : 'answers'}</span></div>
    <div class="question-card-content">
      <h3><button class="question-open" type="button" data-open-question="${escapeText(question.id)}">${escapeText(question.title)}</button></h3>
      ${question.description ? `<p class="question-preview">${escapeText(question.description)}</p>` : ''}
      <div class="question-card-meta">${question.subject ? `<span class="tag">${escapeText(question.subject)}</span>` : ''}<span>Asked by ${escapeText(question.authorName || 'a learner')}</span><time datetime="${escapeText(question.createdAt)}">${escapeText(new Date(question.createdAt).toLocaleDateString())}</time></div>
    </div>
    <div class="vote-box"><button type="button" data-vote="${escapeText(question.id)}" aria-label="Upvote ${escapeText(question.title)}">⌃</button><span>${Number(question.votes || 0)}</span></div>
  </article>`;
}

export async function QuestionsPage(user, query = '', view = 'recent', selectedQuestionId = '') {
  const allQuestions = await listQuestions();
  const selectedQuestion = selectedQuestionId
    ? allQuestions.find(question => question.id === selectedQuestionId)
    : null;

  if (selectedQuestion) {
    const answers = await listAnswers(selectedQuestion.id);
    const answerRows = answers.length
      ? answers.map(answer => `<article class="answer-row"><strong>${escapeText(answer.authorName || 'Learner')}</strong><p>${escapeText(answer.body)}</p><time datetime="${escapeText(answer.createdAt)}">${escapeText(new Date(answer.createdAt).toLocaleDateString())}</time></article>`).join('')
      : '<p class="settings-hint">No answers yet. Share a helpful response.</p>';
    return `<div class="question-detail-page">
      <button type="button" class="btn btn-light btn-sm question-back" data-questions-back>← Back to Questions</button>
      <article class="panel question-detail accent-amber">
        <div class="question-detail-meta">${selectedQuestion.subject ? `<span class="tag">${escapeText(selectedQuestion.subject)}</span>` : ''}<span>Asked by ${escapeText(selectedQuestion.authorName || 'a learner')}</span><time datetime="${escapeText(selectedQuestion.createdAt)}">${escapeText(new Date(selectedQuestion.createdAt).toLocaleDateString())}</time></div>
        <h1>${escapeText(selectedQuestion.title)}</h1>
        <p class="question-detail-description">${escapeText(selectedQuestion.description || '')}</p>
        <div class="question-detail-vote"><button class="btn btn-light btn-sm" type="button" data-vote="${escapeText(selectedQuestion.id)}" aria-label="Upvote ${escapeText(selectedQuestion.title)}">⌃ <span>Upvote</span></button><strong>${Number(selectedQuestion.votes || 0)} votes</strong></div>
      </article>
      <section class="panel question-answers-panel"><div class="panel-head"><h2>Answers</h2><span class="view-all">${answers.length} ${answers.length === 1 ? 'answer' : 'answers'}</span></div><div class="answers-list">${answerRows}</div>
        <form class="question-answer-form" data-question-id="${escapeText(selectedQuestion.id)}"><label for="answer-${escapeText(selectedQuestion.id)}">Your answer</label><textarea class="field" id="answer-${escapeText(selectedQuestion.id)}" name="body" required maxlength="3000" rows="4" placeholder="Share an explanation or helpful suggestion"></textarea><button class="btn btn-sm" type="submit">Post answer</button></form>
      </section>
    </div>`;
  }

  const matchingQuestions = allQuestions.filter(question =>
    `${question.title} ${question.subject || ''} ${question.description || ''}`
      .toLowerCase().includes(query.toLowerCase())
    && (view !== 'unanswered' || Number(question.answerCount || 0) === 0)
    && (view !== 'mine' || question.authorId === user.id)
  );
  if (view === 'trending') matchingQuestions.sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0));
  const body = matchingQuestions.length
    ? `<div class="questions-list">${matchingQuestions.map(questionCard).join('')}</div>`
    : emptyState(query ? 'No questions match your search' : view === 'mine' ? 'You have not asked a question yet' : 'No questions in this view', query ? 'Try another search.' : 'Ask a question or choose another view to browse the community.', '<button class="btn btn-sm" data-modal="question">＋ Ask a question</button>');
  return `<div class="welcome-row"><div><span class="eyebrow">Share what you know</span><h1>Questions &amp; Answers</h1><p>Ask for help, share what you know, and learn together.</p></div><button class="btn btn-sm" data-modal="question">＋ Ask a Question</button></div><div class="content-toolbar"><div class="content-search"><label class="sr-only" for="page-search">Search questions</label><input id="page-search" placeholder="Search questions by topic or subject" value="${escapeText(query)}"></div></div><div class="filter-tabs" role="tablist" aria-label="Question views">${tabs.map(([id, label]) => `<button id="question-tab-${id}" type="button" class="filter-tab ${view === id ? 'active' : ''}" data-question-view="${id}" role="tab" aria-controls="question-view-panel" aria-selected="${view === id}" tabindex="${view === id ? '0' : '-1'}">${label}</button>`).join('')}</div><section class="panel" id="question-view-panel" role="tabpanel" aria-labelledby="question-tab-${view}"><div class="panel-head"><h2>${tabs.find(([id]) => id === view)?.[1] || 'Community questions'}</h2><span class="view-all">${matchingQuestions.length} ${matchingQuestions.length === 1 ? 'question' : 'questions'}</span></div>${body}</section>`;
}

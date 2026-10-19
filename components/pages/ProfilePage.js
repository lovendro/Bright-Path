import { getProfile } from '../../services/profileApi.js';
import { listResourcesByOwner } from '../../services/resourceApi.js';
import { listGroupsForMember } from '../../services/groupApi.js';
import { listQuestionsByAuthor } from '../../services/questionApi.js';
import { escapeText, emptyState } from '../Navigation.js';
import { groupRows, questionRows, resourceCards } from '../PageHelpers.js';

const tabs = [['about', 'About'], ['resources', 'Resources'], ['groups', 'Study Groups'], ['questions', 'Questions']];

export async function ProfilePage(user, activeTab = 'about') {
  const [loadedProfile, myResources, myGroups, myQuestions] = await Promise.all([
    getProfile(user.id), listResourcesByOwner(user.id), listGroupsForMember(user.id), listQuestionsByAuthor(user.id)
  ]);
  const profile = loadedProfile || user;
  const avatar = profile.avatarUrl
    ? `<img src="${escapeText(profile.avatarUrl)}" alt="${escapeText(user.name)} profile picture">`
    : `<span>${escapeText(user.name[0] || '?')}</span>`;
  const about = `<section class="profile-about-grid">
    <article class="panel"><div class="panel-head"><h2>About me</h2></div><p>${escapeText(profile.bio || 'Add a short introduction to tell the community what you are learning.')}</p></article>
    <article class="panel"><div class="panel-head"><h2>Learning interests</h2></div><p>${escapeText(profile.interests || 'Add topics you enjoy learning about.')}</p></article>
  </section>`;
  const resources = myResources.length
    ? await resourceCards(myResources, user.id)
    : emptyState('No resources shared yet', 'Your shared learning materials will appear here.', '<button class="btn btn-sm" data-modal="resource">＋ Share a resource</button>');
  const groups = myGroups.length
    ? groupRows(myGroups, user.id)
    : emptyState('No study groups yet', 'Groups you join will appear here.', '<a class="btn btn-sm" href="#groups" data-page="groups">Explore groups</a>');
  const questions = myQuestions.length
    ? questionRows(myQuestions)
    : emptyState('No questions yet', 'Questions you ask will appear here.', '<button class="btn btn-sm" data-modal="question">＋ Ask a question</button>');
  const tabContent = {
    about,
    resources: `<section class="panel"><div class="panel-head"><h2>My resources</h2><span class="view-all">${myResources.length}</span></div>${resources}</section>`,
    groups: `<section class="panel"><div class="panel-head"><h2>My study groups</h2><span class="view-all">${myGroups.length}</span></div>${groups}</section>`,
    questions: `<section class="panel"><div class="panel-head"><h2>My questions</h2><span class="view-all">${myQuestions.length}</span></div>${questions}</section>`
  };
  const joined = profile.createdAt || user.createdAt;
  return `<div class="welcome-row"><div><span class="eyebrow">Your learning identity</span><h1>My Profile</h1><p>Your profile and contributions to Bright Path.</p></div><button class="btn btn-light btn-sm" data-action="edit-profile">Edit Profile</button></div>
    <section class="profile-hero"><div class="profile-avatar profile-avatar-photo">${avatar}</div><div class="profile-identity"><h2>${escapeText(user.name)}</h2><p>${escapeText(profile.level || user.level || 'Learner')} · Joined ${escapeText(joined ? new Date(joined).toLocaleDateString() : 'Bright Path')}</p><div class="stats"><div><strong>${myResources.length}</strong><span>Resources</span></div><div><strong>${myGroups.length}</strong><span>Study groups</span></div><div><strong>${myQuestions.length}</strong><span>Questions</span></div></div></div></section>
    <div class="filter-tabs profile-tabs" role="tablist" aria-label="Profile sections">${tabs.map(([id, label]) => `<button id="profile-tab-${id}" type="button" class="filter-tab ${activeTab === id ? 'active' : ''}" data-profile-tab="${id}" role="tab" aria-controls="profile-panel" aria-selected="${activeTab === id}" tabindex="${activeTab === id ? '0' : '-1'}">${label}</button>`).join('')}</div>
    <div class="profile-tab-content" id="profile-panel" role="tabpanel" aria-labelledby="profile-tab-${activeTab}">${tabContent[activeTab] || tabContent.about}</div>`;
}

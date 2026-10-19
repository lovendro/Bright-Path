import { getProfile } from '../../services/profileApi.js';
import { listResourcesByOwner } from '../../services/resourceApi.js';
import { listGroupsForMember } from '../../services/groupApi.js';
import { listQuestionsByAuthor } from '../../services/questionApi.js';
import { escapeText } from '../Navigation.js';
import { resourceCards } from '../PageHelpers.js';
export async function ProfilePage(user) {
  const [loadedProfile, myResources, myGroups, myQuestions] = await Promise.all([
    getProfile(user.id), listResourcesByOwner(user.id), listGroupsForMember(user.id), listQuestionsByAuthor(user.id)
  ]);
  const profile = loadedProfile || user;
  const cards = myResources.length ? await resourceCards(myResources, user.id) : '<div class="empty-state"><strong>No contributions yet</strong><p>Your resources and community contributions will show here.</p></div>';
  const avatar = profile.avatarUrl
    ? `<img src="${escapeText(profile.avatarUrl)}" alt="${escapeText(user.name)} profile picture">`
    : `<span>${escapeText(user.name[0] || '?')}</span>`;
  return `<div class="welcome-row"><div><span class="eyebrow">Your learning identity</span><h1>My Profile</h1><p>Your profile and contributions to Bright Path.</p></div><button class="btn btn-light btn-sm" data-action="edit-profile">Edit Profile</button></div><section class="profile-hero"><div class="profile-avatar profile-avatar-photo">${avatar}</div><div><h2>${escapeText(user.name)}</h2><p>${escapeText(profile.level || user.level || 'Learner')} · Joined ${new Date(user.createdAt).toLocaleDateString()}</p><div class="stats"><div><strong>${myResources.length}</strong><span>Resources</span></div><div><strong>${myGroups.length}</strong><span>Study groups</span></div><div><strong>${myQuestions.length}</strong><span>Questions</span></div></div></div></section><section class="panel"><div class="panel-head"><h2>About me</h2></div><p>${escapeText(profile.bio || 'Add a short introduction to tell the community what you are learning.')}</p><p><strong>Interests:</strong> ${escapeText(profile.interests || 'Add topics you enjoy learning about.')}</p></section><section class="panel"><div class="panel-head"><h2>My shared resources</h2></div>${cards}</section>`;
}

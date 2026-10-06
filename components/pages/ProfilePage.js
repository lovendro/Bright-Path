import { getProfile, updateProfile } from '../../services/profileApi.js';
import { listResources } from '../../services/resourceApi.js';
import { escapeText } from '../Navigation.js';
import { resourceCards } from '../PageHelpers.js';
export async function ProfilePage(user) {
  const [loadedProfile, allResources] = await Promise.all([getProfile(user.id), listResources()]);
  const profile = loadedProfile || user;
  const myResources = allResources.filter(item => item.ownerId === user.id);
  const cards = myResources.length ? await resourceCards(myResources, user.id) : '<div class="empty-state"><strong>No contributions yet</strong><p>Your resources and community contributions will show here.</p></div>';
  return `<div class="welcome-row"><div><h1>My Profile</h1><p>Your learning identity and contributions.</p></div><button class="btn btn-light btn-sm" data-action="edit-profile">Edit Profile</button></div><section class="profile-hero"><div class="profile-avatar">${escapeText(user.name[0])}</div><div><h2>${escapeText(user.name)}</h2><p>${escapeText(profile.level || user.level || 'Learner')} · Joined ${new Date(user.createdAt).toLocaleDateString()}</p><div class="stats"><div><strong>${myResources.length}</strong><span>Resources</span></div><div><strong>${myResources.length}</strong><span>Contributions</span></div></div></div></section><section class="panel"><div class="panel-head"><h2>About me</h2></div><p>${escapeText(profile.bio || 'Add a short introduction to tell the community what you are learning.')}</p><p><strong>Interests:</strong> ${escapeText(profile.interests || 'Add topics you enjoy learning about.')}</p></section><section class="panel"><div class="panel-head"><h2>My shared resources</h2></div>${cards}</section>`;
}

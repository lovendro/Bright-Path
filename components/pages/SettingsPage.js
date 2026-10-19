import { getProfile } from '../../services/profileApi.js';
import { escapeText } from '../Navigation.js';
import { icon } from '../Icons.js';

export async function SettingsPage(user) {
  const profile = await getProfile(user.id) || user;
  return `<div class="welcome-row"><div><span class="eyebrow">Make Bright Path yours</span><h1>Settings</h1><p>Manage the appearance of your learning space and who can start a conversation.</p></div></div>
    <form id="settings-form" class="settings-layout">
      <section class="panel settings-card"><div class="settings-card-heading"><span class="settings-card-icon">${icon('sun')}</span><div><h2>Appearance</h2><p>Choose how Bright Path looks on this device.</p></div></div>
        <label class="settings-control" for="settings-theme"><span>Theme</span><select class="field" id="settings-theme" name="theme"><option value="system"${profile.theme === 'system' ? ' selected' : ''}>System</option><option value="light"${profile.theme === 'light' ? ' selected' : ''}>Light</option><option value="dark"${profile.theme === 'dark' ? ' selected' : ''}>Dark</option></select></label>
        <p class="settings-hint">System follows your device preference. Light and Dark keep your choice when you return.</p>
      </section>
      <section class="panel settings-card"><div class="settings-card-heading"><span class="settings-card-icon">${icon('lock')}</span><div><h2>Messaging privacy</h2><p>Choose who can begin a conversation with you.</p></div></div>
        <label class="settings-toggle" for="settings-public"><span><strong>${profile.isPublic ? 'Public account' : 'Private account'}</strong><small>${profile.isPublic ? 'Other learners may start conversations with you directly.' : 'New learners must send a message request for your approval.'}</small></span><input id="settings-public" name="isPublic" type="checkbox"${profile.isPublic ? ' checked' : ''}><span class="toggle-track" aria-hidden="true"></span></label>
      </section>
      <section class="panel settings-card settings-account"><div class="settings-card-heading"><span class="settings-card-icon">${icon('profile')}</span><div><h2>Account</h2><p>Basic details associated with your learning profile.</p></div></div>
        <dl class="settings-account-details"><div><dt>Name</dt><dd>${escapeText(user.name || 'Learner')}</dd></div><div><dt>Learner level</dt><dd>${escapeText(profile.level || user.level || 'Not set')}</dd></div></dl>
      </section>
      <div class="settings-save-row"><button class="btn" type="submit">Save settings</button></div>
    </form>`;
}

import { makeId, readStore, writeStore } from './storage.js';
import { isSupabaseConfigured } from './supabaseConfig.js';
import { clearRemoteSession, getRemoteSession, saveRemoteSession, supabaseAuth } from './supabaseClient.js';

const ACCOUNTS = 'accounts';
const SESSION = 'session';

function mapRemoteUser(remoteUser) {
  if (!remoteUser) return null;
  return {
    id: remoteUser.id,
    name: remoteUser.user_metadata?.full_name || remoteUser.email?.split('@')[0] || 'Learner',
    email: remoteUser.email || '',
    level: remoteUser.user_metadata?.level || 'Independent Learner',
    createdAt: remoteUser.created_at || new Date().toISOString()
  };
}

async function hashPassword(password, salt) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Secure password hashing is unavailable in this browser. Open Bright Path on localhost or HTTPS.');
  }
  const input = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', input);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function register({ name, email, password, level }) {
  if (isSupabaseConfigured) {
    const response = await supabaseAuth('signup', {
      email: email.trim().toLowerCase(), password,
      data: { full_name: name.trim(), level }
    });
    const hasSession = Boolean(response.access_token && response.refresh_token);
    if (hasSession) saveRemoteSession(response);
    return { user: mapRemoteUser(response.user), needsEmailConfirmation: !hasSession };
  }
  const accounts = readStore(ACCOUNTS, []);
  const normalizedEmail = email.trim().toLowerCase();
  if (accounts.some(account => account.email === normalizedEmail)) {
    throw new Error('An account with this email already exists.');
  }
  const salt = makeId();
  const account = {
    id: makeId(), name: name.trim(), email: normalizedEmail, level,
    createdAt: new Date().toISOString(), salt,
    passwordHash: await hashPassword(password, salt)
  };
  writeStore(ACCOUNTS, [...accounts, account]);
  const user = { id: account.id, name: account.name, email: account.email, level: account.level, createdAt: account.createdAt };
  writeStore(SESSION, user);
  return { user, needsEmailConfirmation: false };
}

export async function confirmEmail({ email, token }) {
  const response = await supabaseAuth('verify', {
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: 'signup'
  });
  if (!response.access_token || !response.refresh_token || !response.user) {
    throw new Error('Email confirmation did not return a valid session. Request a new confirmation email and try again.');
  }
  saveRemoteSession(response);
  return mapRemoteUser(response.user);
}

export async function login({ email, password }) {
  if (isSupabaseConfigured) {
    const response = await supabaseAuth('token?grant_type=password', {
      email: email.trim().toLowerCase(), password
    });
    saveRemoteSession(response);
    return { user: mapRemoteUser(response.user), needsEmailConfirmation: false };
  }
  const normalizedEmail = email.trim().toLowerCase();
  const account = readStore(ACCOUNTS, []).find(item => item.email === normalizedEmail);
  if (!account || await hashPassword(password, account.salt) !== account.passwordHash) {
    throw new Error('Email or password is incorrect.');
  }
  const user = { id: account.id, name: account.name, email: account.email, level: account.level, createdAt: account.createdAt };
  writeStore(SESSION, user);
  return { user, needsEmailConfirmation: false };
}

export function currentUser() {
  if (isSupabaseConfigured) return mapRemoteUser(getRemoteSession()?.user);
  return readStore(SESSION, null);
}
export function logout() {
  if (isSupabaseConfigured) clearRemoteSession();
  else localStorage.removeItem('bright-path:v1:session');
}

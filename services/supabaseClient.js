import { readStore, writeStore } from './storage.js';
import { isSupabaseConfigured, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './supabaseConfig.js';

const SESSION_KEY = 'session';

export function getRemoteSession() { return readStore(SESSION_KEY, null); }
export function saveRemoteSession(session) { writeStore(SESSION_KEY, session); }
export function clearRemoteSession() { localStorage.removeItem('bright-path:v1:session'); }

async function responseJson(response) {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

function remoteError(data, response) {
  const message = data?.msg || data?.message || data?.error_description || data?.error || `Supabase request failed (${response.status}).`;
  return new Error(message);
}

export async function supabaseAuth(path, body) {
  if (!isSupabaseConfigured) throw new Error('Remote database is not configured yet. Add your Supabase Project URL and publishable key in services/supabaseConfig.local.js.');
  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await responseJson(response);
  if (!response.ok) throw remoteError(data, response);
  return data;
}

async function refreshSession() {
  const session = getRemoteSession();
  if (!session?.refresh_token) return null;
  const refreshed = await supabaseAuth('token?grant_type=refresh_token', { refresh_token: session.refresh_token });
  saveRemoteSession(refreshed);
  return refreshed;
}

async function request(path, { method = 'GET', body, prefer = '', retry = true } = {}) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
  let session = getRemoteSession();
  if (session?.expires_at && Date.now() / 1000 > session.expires_at - 30) {
    session = await refreshSession();
  }
  const headers = {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${session?.access_token || SUPABASE_PUBLISHABLE_KEY}`,
    Accept: 'application/json'
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (prefer) headers.Prefer = prefer;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = await responseJson(response);
  if (response.status === 401 && retry && session?.refresh_token) {
    await refreshSession();
    return request(path, { method, body, prefer, retry: false });
  }
  if (!response.ok) throw remoteError(data, response);
  return data;
}

export function remoteSelect(table, query = 'select=*') { return request(`${table}?${query}`); }
export function remoteRpc(functionName, body) {
  return request(`rpc/${encodeURIComponent(functionName)}`, { method: 'POST', body });
}
export async function remoteStorageRequest(path, { method = 'GET', body, contentType, upsert = false, retry = true } = {}) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
  let session = getRemoteSession();
  if (session?.expires_at && Date.now() / 1000 > session.expires_at - 30) {
    session = await refreshSession();
  }
  const headers = {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${session?.access_token || SUPABASE_PUBLISHABLE_KEY}`
  };
  if (contentType) headers['Content-Type'] = contentType;
  if (upsert) headers['x-upsert'] = 'true';
  const response = await fetch(`${SUPABASE_URL}/storage/v1/${path}`, { method, headers, body });
  const data = await responseJson(response);
  if (response.status === 401 && retry && session?.refresh_token) {
    await refreshSession();
    return remoteStorageRequest(path, { method, body, contentType, upsert, retry: false });
  }
  if (!response.ok) throw remoteError(data, response);
  return data;
}
export function remoteInsert(table, rows, { query = 'select=*', upsert = false, ignoreDuplicates = false } = {}) {
  const prefer = `return=representation${upsert ? ',resolution=merge-duplicates' : ''}${ignoreDuplicates ? ',resolution=ignore-duplicates' : ''}`;
  return request(`${table}?${query}`, { method: 'POST', body: rows, prefer });
}
export function remoteUpdate(table, query, values) {
  return request(`${table}?${query}`, { method: 'PATCH', body: values, prefer: 'return=representation' });
}
export function remoteDelete(table, query) { return request(`${table}?${query}`, { method: 'DELETE', prefer: 'return=representation' }); }

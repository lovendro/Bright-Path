// Project-specific values go in the ignored api/supabaseConfig.local.js file.
// Only a Supabase publishable key belongs in browser code; never put a secret key here.
let localConfig = {};
try {
  localConfig = await import('./supabaseConfig.local.js');
} catch {
  // A clean clone without local config runs in local-preview mode.
}

export const SUPABASE_URL = localConfig.SUPABASE_URL || '';
export const SUPABASE_PUBLISHABLE_KEY = localConfig.SUPABASE_PUBLISHABLE_KEY || '';

export const isSupabaseConfigured =
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(SUPABASE_URL) &&
  SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_');

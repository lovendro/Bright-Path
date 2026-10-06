const SUPABASE_URL_PATTERN = /^https:\/\/[a-z0-9-]+\.supabase\.co$/;

export default function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (
    typeof url !== 'string' ||
    !SUPABASE_URL_PATTERN.test(url) ||
    typeof publishableKey !== 'string' ||
    !publishableKey.startsWith('sb_publishable_')
  ) {
    return response.status(503).json({
      error: 'Supabase URL and publishable key are not configured.',
    });
  }

  return response.status(200).json({
    SUPABASE_URL: url,
    SUPABASE_PUBLISHABLE_KEY: publishableKey,
  });
}

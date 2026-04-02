import Stripe from 'https://esm.sh/stripe@13.3.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://wordlabs.app',
  'https://morphology-builder.vercel.app',
  'https://nickd135.github.io',
  'http://localhost:8080',
  'http://localhost:3000',
];

function getCorsOrigin(req: Request): string {
  const origin = req.headers.get('origin') || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

function corsHeaders(req: Request) {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(req),
    'Access-Control-Allow-Headers': 'content-type, authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

const ALLOWED_REDIRECT_DOMAINS = [
  'https://wordlabs.app',
  'https://morphology-builder.vercel.app',
  'https://nickd135.github.io',
  'http://localhost:8080',
  'http://localhost:3000',
];

function validateRedirectUrl(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  // Allow relative paths
  if (url.startsWith('/')) return ALLOWED_REDIRECT_DOMAINS[0] + url;
  try {
    const parsed = new URL(url);
    const origin = parsed.origin;
    if (ALLOWED_REDIRECT_DOMAINS.some(d => origin === d || origin === new URL(d).origin)) {
      return url;
    }
  } catch {
    // Invalid URL
  }
  return fallback;
}

Deno.serve(async (req: Request) => {
  const headers = corsHeaders(req);
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) return json({ error: 'Stripe not configured' }, 500);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    const { returnUrl } = await req.json();

    // Get teacher's school
    const { data: teacher } = await supabase
      .from('teachers')
      .select('school_id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (!teacher?.school_id) return json({ error: 'No school found' }, 400);

    const { data: school } = await supabase
      .from('schools')
      .select('stripe_customer_id')
      .eq('id', teacher.school_id)
      .single();

    if (!school?.stripe_customer_id) {
      return json({ error: 'No subscription found. You may be on a free trial.' }, 400);
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const session = await stripe.billingPortal.sessions.create({
      customer: school.stripe_customer_id,
      return_url: validateRedirectUrl(returnUrl, 'https://wordlabs.app/account.html'),
    });

    return json({ url: session.url });
  } catch (err) {
    console.error('create-portal-session error:', err);
    return json({ error: err.message || 'Internal server error' }, 500);
  }
});

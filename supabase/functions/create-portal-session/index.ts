import Stripe from 'https://esm.sh/stripe@13.3.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
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
      return_url: returnUrl || 'https://wordlabs.app/account.html',
    });

    return json({ url: session.url });
  } catch (err) {
    console.error('create-portal-session error:', err);
    return json({ error: err.message || 'Internal server error' }, 500);
  }
});

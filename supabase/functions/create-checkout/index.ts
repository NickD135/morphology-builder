import Stripe from 'https://esm.sh/stripe@13.3.0?target=deno';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) return json({ error: 'Stripe not configured' }, 500);

  // Verify teacher is authenticated
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Unauthorized' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

  const { priceId, planType, extraPacks, successUrl, cancelUrl } = await req.json();
  if (!priceId) return json({ error: 'Missing priceId' }, 400);

  const resolvedPlanType: string = planType || 'school';
  const resolvedExtraPacks: number = Math.max(0, Math.min(10, parseInt(extraPacks) || 0));

  // Get teacher's school
  const { data: teacher } = await supabase
    .from('teachers')
    .select('school_id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (!teacher?.school_id) return json({ error: 'No school found for this teacher' }, 400);

  // Get school details
  const { data: school } = await supabase
    .from('schools')
    .select('id, name, stripe_customer_id')
    .eq('id', teacher.school_id)
    .single();

  if (!school) return json({ error: 'School not found' }, 400);

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  });

  // Create or reuse Stripe customer
  let customerId = school.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: school.name,
      metadata: { school_id: school.id },
    });
    customerId = customer.id;

    const adminSb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    await adminSb.from('schools').update({ stripe_customer_id: customerId }).eq('id', school.id);
  }

  // Build line items — teacher plan can have extra student pack add-ons
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    { price: priceId, quantity: 1 },
  ];

  if (resolvedPlanType === 'teacher' && resolvedExtraPacks > 0) {
    const packPriceId = Deno.env.get('STRIPE_STUDENT_PACK_PRICE_ID');
    if (packPriceId) {
      lineItems.push({ price: packPriceId, quantity: resolvedExtraPacks });
    }
  }

  // Student limit: 35 base + 10 per extra pack (null = unlimited for school plan)
  const studentLimit = resolvedPlanType === 'teacher'
    ? String(35 + resolvedExtraPacks * 10)
    : '';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: lineItems,
    mode: 'subscription',
    allow_promotion_codes: true,
    success_url: successUrl || 'https://wordlabs.app/dashboard?upgraded=1',
    cancel_url: cancelUrl || 'https://wordlabs.app/pricing',
    metadata: {
      school_id: school.id,
      plan_type: resolvedPlanType,
      student_limit: studentLimit,
    },
  });

  return json({ url: session.url });
});

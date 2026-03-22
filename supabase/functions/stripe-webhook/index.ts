import Stripe from 'https://esm.sh/stripe@13.3.0?target=deno';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  const stripeKey     = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!stripeKey || !webhookSecret) {
    return new Response('Stripe not configured', { status: 500 });
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  });

  const body = await req.text();
  const sig  = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    return new Response(`Webhook signature failed: ${(err as Error).message}`, { status: 400 });
  }

  const adminSb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  switch (event.type) {
    case 'checkout.session.completed': {
      const session  = event.data.object as Stripe.CheckoutSession;
      const schoolId = session.metadata?.school_id;
      const planType = session.metadata?.plan_type || 'school';
      const studentLimitStr = session.metadata?.student_limit;

      if (schoolId) {
        const update: Record<string, unknown> = {
          plan: planType === 'teacher' ? 'teacher' : 'active',
          stripe_customer_id: session.customer as string,
        };
        // Set student limit for teacher plans; clear it (null) for school plans
        if (planType === 'teacher' && studentLimitStr) {
          update.student_limit = parseInt(studentLimitStr, 10);
        } else if (planType === 'school') {
          update.student_limit = null;
        }
        await adminSb.from('schools').update(update).eq('id', schoolId);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub        = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      await adminSb.from('schools')
        .update({ plan: 'expired' })
        .eq('stripe_customer_id', customerId);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice    = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      await adminSb.from('schools')
        .update({ plan: 'payment_failed' })
        .eq('stripe_customer_id', customerId);
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

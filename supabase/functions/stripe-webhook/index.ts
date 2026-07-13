// HAVNORA payments webhook: flips ledger rows to their real status when
// Stripe confirms them. Deploy alongside create-checkout:
//   supabase functions deploy stripe-webhook --no-verify-jwt
//   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
// Then point a Stripe webhook (checkout.session.completed,
// checkout.session.expired, charge.refunded) at this function's URL.

import Stripe from "npm:stripe@16";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    return new Response("Webhook not configured", { status: 503 });
  }

  const stripe = new Stripe(stripeKey);
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      await req.text(),
      req.headers.get("stripe-signature") ?? "",
      webhookSecret,
    );
  } catch {
    return new Response("Bad signature", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const setStatus = (ref: string, status: string) =>
    supabase.from("payments").update({ status }).eq("provider_ref", ref);

  switch (event.type) {
    case "checkout.session.completed":
      await setStatus((event.data.object as Stripe.Checkout.Session).id, "succeeded");
      break;
    case "checkout.session.expired":
      await setStatus((event.data.object as Stripe.Checkout.Session).id, "failed");
      break;
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const sessions = await stripe.checkout.sessions.list({ payment_intent: String(charge.payment_intent), limit: 1 });
      if (sessions.data[0]) await setStatus(sessions.data[0].id, "refunded");
      break;
    }
  }
  return new Response("ok");
});

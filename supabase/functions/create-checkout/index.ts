// HAVNORA checkout: creates a Stripe Checkout Session for a property
// down payment or full payment, then records the pending payment row
// with the service role key. Deploy with:
//   supabase functions deploy create-checkout
//   supabase secrets set STRIPE_SECRET_KEY=sk_live_or_test_...
// Until STRIPE_SECRET_KEY is set, the frontend stays in demo mode.

import Stripe from "npm:stripe@16";
import { createClient } from "npm:@supabase/supabase-js@2";

const MIN_DOWN_PAYMENT = 30000; // dollars

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return Response.json(
        { error: "Payments are not live yet. Set STRIPE_SECRET_KEY to enable checkout." },
        { status: 503, headers: cors },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // caller must be a signed-in Havnora user
    const jwt = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
    const { data: { user } } = await createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    ).auth.getUser(jwt);
    if (!user) return Response.json({ error: "Sign in to continue." }, { status: 401, headers: cors });

    const { propertyId, kind, successUrl, cancelUrl } = await req.json();
    const { data: property } = await supabase
      .from("properties").select("*").eq("id", propertyId).single();
    if (!property) return Response.json({ error: "Unknown property." }, { status: 404, headers: cors });

    const amount = kind === "full_payment" ? property.price : property.down_payment;
    if (kind === "down_payment" && amount < MIN_DOWN_PAYMENT) {
      return Response.json({ error: "Minimum down payment is $30,000." }, { status: 400, headers: cors });
    }

    const stripe = new Stripe(stripeKey);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amount * 100,
          product_data: {
            name: `${kind === "full_payment" ? "Full payment" : "Down payment"} · ${property.address}, ${property.city}`,
          },
        },
      }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { property_id: propertyId, user_id: user.id, kind },
    });

    const receipt = "HV-" + crypto.randomUUID().slice(0, 8).toUpperCase();
    await supabase.from("payments").insert({
      user_id: user.id,
      property_id: propertyId,
      kind,
      amount,
      status: "requires_action",
      provider: "stripe",
      provider_ref: session.id,
      receipt_code: receipt,
    });

    return Response.json({ url: session.url, receipt }, { headers: cors });
  } catch (e) {
    return Response.json({ error: String(e?.message ?? e) }, { status: 500, headers: cors });
  }
});

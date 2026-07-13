# HAVNORA Payments

## How it works today (test mode)

Every surface of the payment system is live in the product:

- `payment.html?id=<listing>&kind=down|full` is the checkout: payment type
  toggle, adjustable down payment (minimum $30,000, enforced), buyer
  details, terms confirmation, processing state, receipt.
- Receipts land in the ledger: locally on the device, and in the Supabase
  `payments` table when the buyer is signed in (status `test`).
- The dashboard Payments view lists every receipt with status badges.
- Test mode is labeled on the checkout ribbon, the success screen, and the
  ledger, so no buyer can mistake a demo for a real charge.

Row level security guarantees clients can only ever write `test` rows.
Real (live) rows can only be written server-side with the service role key.

## Going live (owner checklist)

Real money movement requires a verified payment processor account that
only the owner controls. No shortcut around this is safe or legal.

1. Create a Stripe account and complete business verification (KYB).
2. Install the Supabase CLI and link the project.
3. Deploy the checkout function shipped in this repo:
   `supabase functions deploy create-checkout`
4. Set the secrets (never commit these):
   `supabase secrets set STRIPE_SECRET_KEY=sk_test_...` (start with test keys)
5. Add a Stripe webhook (checkout.session.completed) pointed at a small
   companion function that flips the payment row to `succeeded` using the
   service role key. (Scaffold it alongside create-checkout when ready.)
6. Test the full flow with Stripe test cards, then swap to live keys.

The frontend needs zero changes: `hvApi.createCheckout` already calls the
function first and only falls back to test mode when it is absent.

## Design decisions

- Client never touches card data: Stripe-hosted checkout only.
- $30,000 minimum down payment enforced in the UI, the Edge Function, and
  a database CHECK constraint.
- All payments reference the property and buyer, and carry a receipt code
  shown to the buyer at completion.

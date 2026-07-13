-- HAVNORA payments ledger (applied 2026-07-13).
-- Real (live) payment rows are written ONLY by the server-side checkout
-- webhook using the service role key. Clients may insert test-mode rows
-- so the full experience works before Stripe goes live.

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.havnora_profiles(id) on delete set null,
  property_id text references public.properties(id) on delete set null,
  kind text not null check (kind in ('down_payment','full_payment','earnest')),
  amount integer not null check (amount >= 30000 or kind <> 'down_payment'),
  currency text not null default 'usd',
  status text not null default 'test'
    check (status in ('test','requires_action','processing','succeeded','refunded','failed')),
  provider text not null default 'demo',
  provider_ref text,
  receipt_code text not null,
  created_at timestamptz not null default now()
);
alter table public.payments enable row level security;

create policy "payments owner read" on public.payments for select
  using (auth.uid() = user_id);

-- clients may only ever write clearly-labeled test rows for themselves
create policy "payments test insert" on public.payments for insert
  with check (auth.uid() = user_id and status = 'test' and provider = 'demo');

create index idx_payments_user on public.payments (user_id);

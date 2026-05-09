create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  payment_id text,
  payment_method text,
  status text,
  amount numeric,
  created_at timestamptz default now()
);

create index if not exists payments_order_id_idx on public.payments(order_id);
create index if not exists payments_payment_id_idx on public.payments(payment_id);

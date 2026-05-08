ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cashfree_order_id text,
  ADD COLUMN IF NOT EXISTS cashfree_payment_session_id text,
  ADD COLUMN IF NOT EXISTS cashfree_response jsonb;
-- Payment status enum
DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status public.payment_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS phonepe_merchant_transaction_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS phonepe_transaction_id text,
  ADD COLUMN IF NOT EXISTS phonepe_response jsonb;

-- Backfill: existing COD orders should be marked as paid-on-delivery (treated as 'pending' until delivered is fine)
-- We'll mark existing rows as 'pending' (default) which is correct.

-- Index for quick lookup during callback
CREATE INDEX IF NOT EXISTS orders_phonepe_merchant_txn_idx ON public.orders (phonepe_merchant_transaction_id);
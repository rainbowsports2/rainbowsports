-- Add tracking number column
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number text UNIQUE;

-- Function to generate a short tracking number
CREATE OR REPLACE FUNCTION public.generate_tracking_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := 'RS-';
  i int;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Trigger function that sets tracking_number on insert if not provided
CREATE OR REPLACE FUNCTION public.set_order_tracking_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  candidate text;
  attempts int := 0;
BEGIN
  IF NEW.tracking_number IS NULL THEN
    LOOP
      candidate := public.generate_tracking_number();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE tracking_number = candidate);
      attempts := attempts + 1;
      IF attempts > 10 THEN
        candidate := 'RS-' || replace(gen_random_uuid()::text, '-', '');
        EXIT;
      END IF;
    END LOOP;
    NEW.tracking_number := candidate;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_set_tracking_number ON public.orders;
CREATE TRIGGER orders_set_tracking_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_order_tracking_number();

-- Backfill existing orders
DO $$
DECLARE
  r record;
  candidate text;
BEGIN
  FOR r IN SELECT id FROM public.orders WHERE tracking_number IS NULL LOOP
    LOOP
      candidate := public.generate_tracking_number();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE tracking_number = candidate);
    END LOOP;
    UPDATE public.orders SET tracking_number = candidate WHERE id = r.id;
  END LOOP;
END $$;
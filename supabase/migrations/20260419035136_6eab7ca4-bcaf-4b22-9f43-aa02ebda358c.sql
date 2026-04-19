-- Add is_blocked flag to profiles for soft-blocking users
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false;

-- Allow admins to view all profiles (in addition to users viewing their own)
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
CREATE POLICY "Admins view all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update any profile (e.g., to flip is_blocked)
DROP POLICY IF EXISTS "Admins update any profile" ON public.profiles;
CREATE POLICY "Admins update any profile"
  ON public.profiles
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Auto-create a profile row when a new auth user signs up so we have somewhere
-- to store is_blocked + display info even before they edit their profile.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NULLIF(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Make user_id unique so ON CONFLICT works
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'profiles_user_id_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for existing users
INSERT INTO public.profiles (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

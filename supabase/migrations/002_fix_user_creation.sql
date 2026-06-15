-- ============================================================
-- FIX: "Database error creating new user"
-- Run this in Supabase → SQL Editor → New query → Run
-- ============================================================

-- 1. Recreate the profile-creation trigger (Supabase-compatible)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), 'User'),
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
      'user_' || REPLACE(substr(NEW.id::text, 1, 13), '-', '')
    )
  );
  RETURN NEW;
END;
$$;

-- 2. Grant auth service permission to write profiles (required for dashboard user creation)
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON TABLE public.profiles TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- 3. Re-attach trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Fix RLS policy that was blocking profile inserts during signup
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- AFTER creating your user in Authentication → Users, run this
-- to promote them to admin (replace the email):
-- ============================================================
--
-- UPDATE public.profiles
-- SET role = 'admin', is_verified = true
-- WHERE id = (
--   SELECT id FROM auth.users
--   WHERE email = 'adriankurtalani@hotmail.com'
-- );
--

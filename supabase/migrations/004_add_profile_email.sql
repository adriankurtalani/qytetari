-- Add email to profiles and sync from auth.users
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Backfill emails for existing users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Update trigger to save email and better defaults from registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, email)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
      split_part(NEW.email, '@', 1),
      'User'
    ),
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
      'user_' || REPLACE(substr(NEW.id::text, 1, 13), '-', '')
    ),
    NEW.email
  );
  RETURN NEW;
END;
$$;

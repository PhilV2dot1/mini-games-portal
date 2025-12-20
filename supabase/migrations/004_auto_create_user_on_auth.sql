-- ============================================================================
-- Migration 004: Auto-create user profile on authentication
-- ============================================================================
-- This migration creates a trigger that automatically creates a user profile
-- in the 'users' table when a new user signs up via Supabase Auth (OAuth or email)

-- ============================================================================
-- Function: Automatically create user profile on auth signup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  new_username TEXT;
  provider_name TEXT;
BEGIN
  -- Determine the provider
  provider_name := COALESCE(
    NEW.raw_app_meta_data->>'provider',
    'email'
  );

  -- Generate username from email or random ID
  IF NEW.email IS NOT NULL THEN
    new_username := split_part(NEW.email, '@', 1);
  ELSE
    new_username := 'Player_' || substring(NEW.id::text, 1, 8);
  END IF;

  -- Check if user already exists (in case of re-signup)
  IF EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = NEW.id::text) THEN
    RETURN NEW;
  END IF;

  -- Insert new user into users table
  INSERT INTO public.users (
    auth_user_id,
    email,
    username,
    auth_provider,
    is_anonymous,
    claimed_at,
    total_points,
    avatar_type
  ) VALUES (
    NEW.id::text,
    NEW.email,
    new_username,
    provider_name,
    false,
    NOW(),
    0,
    'default'
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- User already exists, that's fine
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail auth
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Trigger: Execute function after user authentication
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires after user is created in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================================
-- Grant permissions
-- ============================================================================

-- Ensure the function can be executed by the auth system
GRANT EXECUTE ON FUNCTION public.handle_new_auth_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_auth_user() TO service_role;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON FUNCTION public.handle_new_auth_user() IS
  'Automatically creates a user profile in the users table when a new user signs up via Supabase Auth';

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
  'Triggers profile creation in users table after authentication signup';

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- To test this migration works:
-- 1. Sign up with a new email or OAuth provider
-- 2. Check that a record was created in public.users
-- 3. Verify the auth_user_id matches the auth.users.id

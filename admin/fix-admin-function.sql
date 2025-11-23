-- Fix the is_admin_user() function
-- The error was: column "app_metadata" does not exist
-- This fixes the function to use raw_app_meta_data correctly

CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_metadata JSONB;
BEGIN
  -- Get the current user's raw_app_meta_data from auth.users
  SELECT raw_app_meta_data INTO user_metadata
  FROM auth.users
  WHERE id = auth.uid();
  
  -- Return false if no user found
  IF user_metadata IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if is_admin is true in raw_app_meta_data
  RETURN COALESCE((user_metadata->>'is_admin')::boolean, false);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user() TO anon;

-- Test the function (should return true if you're logged in as admin)
SELECT is_admin_user();


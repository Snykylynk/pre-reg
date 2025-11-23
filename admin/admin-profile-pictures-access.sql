-- Admin access to profile_pictures table
-- Run this in Supabase SQL Editor to allow admins to view all profile pictures

-- First, ensure is_admin_user() function exists (from admin-rls-policies.sql)
-- If it doesn't exist, create it:
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

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all profile pictures" ON profile_pictures;
DROP POLICY IF EXISTS "Admins can manage all profile pictures" ON profile_pictures;

-- Admin can view all profile pictures
CREATE POLICY "Admins can view all profile pictures"
  ON profile_pictures FOR SELECT
  TO authenticated
  USING (is_admin_user());

-- Admin can insert/update/delete all profile pictures (if needed)
CREATE POLICY "Admins can manage all profile pictures"
  ON profile_pictures FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());


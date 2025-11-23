-- Admin RLS Policies for Snyk Lynk Admin Dashboard
-- Run this SQL in your Supabase SQL Editor to grant admin users access to all profiles
-- Admin users are identified by app_metadata.is_admin = true

-- Function to check if current user is admin
-- This function checks the user's raw_app_meta_data in auth.users table
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
  -- Note: The column is raw_app_meta_data, not app_metadata
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user() TO anon;

-- Admin policies for escort_profiles
-- Admins can view all escort profiles
CREATE POLICY "Admins can view all escort profiles"
  ON escort_profiles FOR SELECT
  USING (is_admin_user());

-- Admins can update all escort profiles
CREATE POLICY "Admins can update all escort profiles"
  ON escort_profiles FOR UPDATE
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Admin policies for taxi_owner_profiles
-- Admins can view all taxi profiles
CREATE POLICY "Admins can view all taxi profiles"
  ON taxi_owner_profiles FOR SELECT
  USING (is_admin_user());

-- Admins can update all taxi profiles
CREATE POLICY "Admins can update all taxi profiles"
  ON taxi_owner_profiles FOR UPDATE
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Note: To create an admin user, use the Supabase Dashboard:
-- 1. Go to Authentication > Users
-- 2. Create a new user or edit an existing user
-- 3. In the user's metadata, add: { "is_admin": true } to app_metadata
-- 
-- Or use the Supabase Admin API:
-- supabase.auth.admin.updateUserById(userId, {
--   app_metadata: { is_admin: true }
-- })


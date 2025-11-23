-- Add banned column and admin DELETE policies for escort and taxi profiles
-- Run this SQL in your Supabase SQL Editor

-- Add banned column to escort_profiles if it doesn't exist
ALTER TABLE escort_profiles 
ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT false;

-- Add banned column to taxi_owner_profiles if it doesn't exist
ALTER TABLE taxi_owner_profiles 
ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT false;

-- Ensure is_admin_user() function exists (from admin-rls-policies.sql)
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user() TO anon;

-- Admin DELETE policies for escort_profiles
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can delete all escort profiles" ON escort_profiles;

-- Admins can delete all escort profiles
CREATE POLICY "Admins can delete all escort profiles"
  ON escort_profiles FOR DELETE
  USING (is_admin_user());

-- Admin DELETE policies for taxi_owner_profiles
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can delete all taxi profiles" ON taxi_owner_profiles;

-- Admins can delete all taxi profiles
CREATE POLICY "Admins can delete all taxi profiles"
  ON taxi_owner_profiles FOR DELETE
  USING (is_admin_user());


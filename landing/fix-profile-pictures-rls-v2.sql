-- Fix RLS policies for profile_pictures table (Version 2)
-- This uses a helper function approach similar to admin policies

-- First, create a helper function to check if user owns the profile
CREATE OR REPLACE FUNCTION user_owns_profile(
  p_profile_id UUID,
  p_profile_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_user_id UUID;
BEGIN
  IF p_profile_type = 'escort' THEN
    SELECT user_id INTO profile_user_id
    FROM escort_profiles
    WHERE id = p_profile_id;
  ELSIF p_profile_type = 'taxi' THEN
    SELECT user_id INTO profile_user_id
    FROM taxi_owner_profiles
    WHERE id = p_profile_id;
  ELSE
    RETURN false;
  END IF;
  
  RETURN profile_user_id = auth.uid();
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION user_owns_profile(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION user_owns_profile(UUID, TEXT) TO anon;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile pictures" ON profile_pictures;
DROP POLICY IF EXISTS "Users can insert own profile pictures" ON profile_pictures;
DROP POLICY IF EXISTS "Users can update own profile pictures" ON profile_pictures;
DROP POLICY IF EXISTS "Users can delete own profile pictures" ON profile_pictures;
DROP POLICY IF EXISTS "Admins can view all profile pictures" ON profile_pictures;
DROP POLICY IF EXISTS "Admins can manage all profile pictures" ON profile_pictures;

-- Recreate policies using the helper function
-- Users can view pictures of their own profile
CREATE POLICY "Users can view own profile pictures"
  ON profile_pictures FOR SELECT
  USING (user_owns_profile(profile_id, profile_type));

-- Users can insert pictures for their own profile
CREATE POLICY "Users can insert own profile pictures"
  ON profile_pictures FOR INSERT
  WITH CHECK (user_owns_profile(profile_id, profile_type));

-- Users can update pictures of their own profile
CREATE POLICY "Users can update own profile pictures"
  ON profile_pictures FOR UPDATE
  USING (user_owns_profile(profile_id, profile_type))
  WITH CHECK (user_owns_profile(profile_id, profile_type));

-- Users can delete pictures of their own profile
CREATE POLICY "Users can delete own profile pictures"
  ON profile_pictures FOR DELETE
  USING (user_owns_profile(profile_id, profile_type));

-- Admin can view all profile pictures (for admin dashboard)
CREATE POLICY "Admins can view all profile pictures"
  ON profile_pictures FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'role' = 'admin' OR raw_app_meta_data->>'is_admin' = 'true')
    )
  );

-- Admin can insert/update/delete all profile pictures (for admin operations)
CREATE POLICY "Admins can manage all profile pictures"
  ON profile_pictures FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'role' = 'admin' OR raw_app_meta_data->>'is_admin' = 'true')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'role' = 'admin' OR raw_app_meta_data->>'is_admin' = 'true')
    )
  );


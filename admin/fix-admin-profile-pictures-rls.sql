-- Fix admin access to profile_pictures table
-- This ensures admins can view all profile pictures even if user policies conflict

-- Ensure is_admin_user() function exists and works correctly
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

-- Drop ALL existing policies on profile_pictures to start fresh
DROP POLICY IF EXISTS "Users can view own profile pictures" ON profile_pictures;
DROP POLICY IF EXISTS "Users can insert own profile pictures" ON profile_pictures;
DROP POLICY IF EXISTS "Users can update own profile pictures" ON profile_pictures;
DROP POLICY IF EXISTS "Users can delete own profile pictures" ON profile_pictures;
DROP POLICY IF EXISTS "Admins can view all profile pictures" ON profile_pictures;
DROP POLICY IF EXISTS "Admins can manage all profile pictures" ON profile_pictures;

-- IMPORTANT: Create admin policies FIRST (they take precedence)
-- Admin can view all profile pictures
CREATE POLICY "Admins can view all profile pictures"
  ON profile_pictures FOR SELECT
  TO authenticated
  USING (is_admin_user());

-- Admin can manage all profile pictures
CREATE POLICY "Admins can manage all profile pictures"
  ON profile_pictures FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Now create user policies (these won't conflict because admin check comes first)
-- Users can view pictures of their own profile
CREATE POLICY "Users can view own profile pictures"
  ON profile_pictures FOR SELECT
  TO authenticated
  USING (
    NOT is_admin_user() AND (
      (profile_type = 'escort' AND EXISTS (
        SELECT 1 FROM escort_profiles 
        WHERE escort_profiles.id = profile_pictures.profile_id 
        AND escort_profiles.user_id = auth.uid()
      )) OR
      (profile_type = 'taxi' AND EXISTS (
        SELECT 1 FROM taxi_owner_profiles 
        WHERE taxi_owner_profiles.id = profile_pictures.profile_id 
        AND taxi_owner_profiles.user_id = auth.uid()
      ))
    )
  );

-- Users can insert pictures for their own profile
CREATE POLICY "Users can insert own profile pictures"
  ON profile_pictures FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT is_admin_user() AND (
      (profile_type = 'escort' AND EXISTS (
        SELECT 1 FROM escort_profiles 
        WHERE escort_profiles.id = profile_id 
        AND escort_profiles.user_id = auth.uid()
      )) OR
      (profile_type = 'taxi' AND EXISTS (
        SELECT 1 FROM taxi_owner_profiles 
        WHERE taxi_owner_profiles.id = profile_id 
        AND taxi_owner_profiles.user_id = auth.uid()
      ))
    )
  );

-- Users can update pictures of their own profile
CREATE POLICY "Users can update own profile pictures"
  ON profile_pictures FOR UPDATE
  TO authenticated
  USING (
    NOT is_admin_user() AND (
      (profile_type = 'escort' AND EXISTS (
        SELECT 1 FROM escort_profiles 
        WHERE escort_profiles.id = profile_pictures.profile_id 
        AND escort_profiles.user_id = auth.uid()
      )) OR
      (profile_type = 'taxi' AND EXISTS (
        SELECT 1 FROM taxi_owner_profiles 
        WHERE taxi_owner_profiles.id = profile_pictures.profile_id 
        AND taxi_owner_profiles.user_id = auth.uid()
      ))
    )
  )
  WITH CHECK (
    NOT is_admin_user() AND (
      (profile_type = 'escort' AND EXISTS (
        SELECT 1 FROM escort_profiles 
        WHERE escort_profiles.id = profile_id 
        AND escort_profiles.user_id = auth.uid()
      )) OR
      (profile_type = 'taxi' AND EXISTS (
        SELECT 1 FROM taxi_owner_profiles 
        WHERE taxi_owner_profiles.id = profile_id 
        AND taxi_owner_profiles.user_id = auth.uid()
      ))
    )
  );

-- Users can delete pictures of their own profile
CREATE POLICY "Users can delete own profile pictures"
  ON profile_pictures FOR DELETE
  TO authenticated
  USING (
    NOT is_admin_user() AND (
      (profile_type = 'escort' AND EXISTS (
        SELECT 1 FROM escort_profiles 
        WHERE escort_profiles.id = profile_pictures.profile_id 
        AND escort_profiles.user_id = auth.uid()
      )) OR
      (profile_type = 'taxi' AND EXISTS (
        SELECT 1 FROM taxi_owner_profiles 
        WHERE taxi_owner_profiles.id = profile_pictures.profile_id 
        AND taxi_owner_profiles.user_id = auth.uid()
      ))
    )
  );


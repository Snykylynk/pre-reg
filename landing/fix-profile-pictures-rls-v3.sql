-- Fix RLS policies for profile_pictures table (Version 3)
-- This version handles the case where auth.uid() might be null by using a more direct approach

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile pictures" ON profile_pictures;
DROP POLICY IF EXISTS "Users can insert own profile pictures" ON profile_pictures;
DROP POLICY IF EXISTS "Users can update own profile pictures" ON profile_pictures;
DROP POLICY IF EXISTS "Users can delete own profile pictures" ON profile_pictures;
DROP POLICY IF EXISTS "Admins can view all profile pictures" ON profile_pictures;
DROP POLICY IF EXISTS "Admins can manage all profile pictures" ON profile_pictures;

-- Recreate policies with direct checks (more reliable)
-- Users can view pictures of their own profile
CREATE POLICY "Users can view own profile pictures"
  ON profile_pictures FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
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
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
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
  USING (
    auth.uid() IS NOT NULL AND (
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
    auth.uid() IS NOT NULL AND (
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
  USING (
    auth.uid() IS NOT NULL AND (
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


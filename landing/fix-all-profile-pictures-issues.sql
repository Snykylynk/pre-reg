-- Complete fix for all profile pictures issues
-- Run this to fix RLS policies, create functions, and grant permissions

-- ============================================
-- Step 1: Create the insert_profile_picture function
-- ============================================
CREATE OR REPLACE FUNCTION insert_profile_picture(
  p_profile_id UUID,
  p_profile_type TEXT,
  p_image_url TEXT,
  p_display_order INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  picture_id UUID;
  profile_user_id UUID;
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to insert profile pictures';
  END IF;
  
  -- Verify profile ownership
  IF p_profile_type = 'escort' THEN
    SELECT user_id INTO profile_user_id
    FROM escort_profiles
    WHERE id = p_profile_id;
    
    IF profile_user_id IS NULL THEN
      RAISE EXCEPTION 'Profile not found';
    END IF;
    
    IF profile_user_id != current_user_id THEN
      RAISE EXCEPTION 'Profile does not belong to current user';
    END IF;
  ELSIF p_profile_type = 'taxi' THEN
    SELECT user_id INTO profile_user_id
    FROM taxi_owner_profiles
    WHERE id = p_profile_id;
    
    IF profile_user_id IS NULL THEN
      RAISE EXCEPTION 'Profile not found';
    END IF;
    
    IF profile_user_id != current_user_id THEN
      RAISE EXCEPTION 'Profile does not belong to current user';
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid profile type: %', p_profile_type;
  END IF;
  
  -- Check max pictures limit
  IF (SELECT COUNT(*) FROM profile_pictures 
      WHERE profile_id = p_profile_id 
      AND profile_type = p_profile_type) >= 5 THEN
    RAISE EXCEPTION 'Maximum of 5 pictures allowed per profile';
  END IF;
  
  -- Insert the picture
  INSERT INTO profile_pictures (
    profile_id,
    profile_type,
    image_url,
    display_order
  ) VALUES (
    p_profile_id,
    p_profile_type,
    p_image_url,
    p_display_order
  )
  RETURNING id INTO picture_id;
  
  RETURN picture_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION insert_profile_picture(UUID, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_profile_picture(UUID, TEXT, TEXT, INTEGER) TO anon;

-- ============================================
-- Step 2: Fix user_owns_profile function (don't access auth.users)
-- ============================================
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
  current_user_id UUID;
BEGIN
  -- Get current user ID (no need to query auth.users)
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get profile user_id
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
  
  -- Return true if profile belongs to current user
  RETURN profile_user_id = current_user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION user_owns_profile(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION user_owns_profile(UUID, TEXT) TO anon;

-- ============================================
-- Step 3: Drop and recreate RLS policies
-- ============================================
DROP POLICY IF EXISTS "Users can view own profile pictures" ON profile_pictures;
DROP POLICY IF EXISTS "Users can insert own profile pictures" ON profile_pictures;
DROP POLICY IF EXISTS "Users can update own profile pictures" ON profile_pictures;
DROP POLICY IF EXISTS "Users can delete own profile pictures" ON profile_pictures;
DROP POLICY IF EXISTS "Admins can view all profile pictures" ON profile_pictures;
DROP POLICY IF EXISTS "Admins can manage all profile pictures" ON profile_pictures;

-- Users can view pictures of their own profile
CREATE POLICY "Users can view own profile pictures"
  ON profile_pictures FOR SELECT
  TO authenticated
  USING (user_owns_profile(profile_id, profile_type));

-- Users can insert pictures for their own profile
CREATE POLICY "Users can insert own profile pictures"
  ON profile_pictures FOR INSERT
  TO authenticated
  WITH CHECK (user_owns_profile(profile_id, profile_type));

-- Users can update pictures of their own profile
CREATE POLICY "Users can update own profile pictures"
  ON profile_pictures FOR UPDATE
  TO authenticated
  USING (user_owns_profile(profile_id, profile_type))
  WITH CHECK (user_owns_profile(profile_id, profile_type));

-- Users can delete pictures of their own profile
CREATE POLICY "Users can delete own profile pictures"
  ON profile_pictures FOR DELETE
  TO authenticated
  USING (user_owns_profile(profile_id, profile_type));

-- Note: Admin policies can be added later if needed
-- For now, admins can use service role or we can add admin check function later


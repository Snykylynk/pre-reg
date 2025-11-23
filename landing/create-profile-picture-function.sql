-- Create a function to insert profile pictures that bypasses RLS
-- This ensures inserts work even if there are session issues

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


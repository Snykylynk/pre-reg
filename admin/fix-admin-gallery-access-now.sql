-- Quick fix: Create admin function to bypass RLS for gallery images
-- This will work immediately even if RLS policies are blocking

-- Drop existing function if it exists (in case return type changed)
DROP FUNCTION IF EXISTS get_profile_pictures_admin(UUID, TEXT);

-- Create the function
CREATE FUNCTION get_profile_pictures_admin(
  p_profile_id UUID,
  p_profile_type TEXT
)
RETURNS TABLE (
  id UUID,
  profile_id UUID,
  profile_type TEXT,
  image_url TEXT,
  display_order INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pp.id,
    pp.profile_id,
    pp.profile_type,
    pp.image_url,
    pp.display_order,
    pp.created_at,
    pp.updated_at
  FROM profile_pictures pp
  WHERE pp.profile_id = p_profile_id
    AND pp.profile_type = p_profile_type
  ORDER BY pp.display_order ASC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_profile_pictures_admin(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_profile_pictures_admin(UUID, TEXT) TO anon;

-- Test it works
SELECT * FROM get_profile_pictures_admin('8de9b54f-fbeb-4b76-a282-97978f96c84f'::uuid, 'escort');


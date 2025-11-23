-- Diagnostic queries to check profile_pictures access
-- Run these queries one by one in Supabase SQL Editor to diagnose the issue

-- ============================================
-- Query 1: Check if profile_pictures exist for the profile
-- ============================================
-- Replace '8de9b54f-fbeb-4b76-a282-97978f96c84f' with the actual profile_id
SELECT 
  id,
  profile_id,
  profile_type,
  image_url,
  display_order,
  created_at
FROM profile_pictures
WHERE profile_id = '8de9b54f-fbeb-4b76-a282-97978f96c84f'
  AND profile_type = 'escort'
ORDER BY display_order;

-- ============================================
-- Query 2: Check ALL profile_pictures (bypass RLS)
-- ============================================
-- This will show all pictures regardless of RLS (run as service role or with SECURITY DEFINER)
SELECT 
  id,
  profile_id,
  profile_type,
  image_url,
  display_order,
  created_at
FROM profile_pictures
WHERE profile_type = 'escort'
ORDER BY profile_id, display_order
LIMIT 20;

-- ============================================
-- Query 3: Test is_admin_user() function
-- ============================================
-- This should return true if you're logged in as admin
SELECT 
  auth.uid() as current_user_id,
  is_admin_user() as is_admin,
  (SELECT raw_app_meta_data->>'is_admin' FROM auth.users WHERE id = auth.uid()) as admin_metadata;

-- ============================================
-- Query 4: Check RLS policies on profile_pictures
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profile_pictures'
ORDER BY policyname;

-- ============================================
-- Query 5: Check if RLS is enabled
-- ============================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profile_pictures';

-- ============================================
-- Query 6: Test query as current user (with RLS)
-- ============================================
-- This simulates what the admin dashboard is doing
SELECT 
  COUNT(*) as total_pictures,
  COUNT(*) FILTER (WHERE profile_id = '8de9b54f-fbeb-4b76-a282-97978f96c84f') as pictures_for_profile
FROM profile_pictures
WHERE profile_type = 'escort';

-- ============================================
-- Query 7: Check escort profile exists
-- ============================================
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  email
FROM escort_profiles
WHERE id = '8de9b54f-fbeb-4b76-a282-97978f96c84f';

-- ============================================
-- Query 8: Check all pictures for all escort profiles
-- ============================================
SELECT 
  ep.id as profile_id,
  ep.first_name,
  ep.last_name,
  COUNT(pp.id) as picture_count
FROM escort_profiles ep
LEFT JOIN profile_pictures pp ON pp.profile_id = ep.id AND pp.profile_type = 'escort'
GROUP BY ep.id, ep.first_name, ep.last_name
HAVING COUNT(pp.id) > 0
ORDER BY picture_count DESC;

-- ============================================
-- Query 9: Direct check - Get pictures for specific profile (bypass RLS check)
-- ============================================
-- This uses a function to bypass RLS
CREATE OR REPLACE FUNCTION get_profile_pictures_admin(
  p_profile_id UUID,
  p_profile_type TEXT
)
RETURNS TABLE (
  id UUID,
  profile_id UUID,
  profile_type TEXT,
  image_url TEXT,
  display_order INTEGER,
  created_at TIMESTAMPTZ
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
    pp.created_at
  FROM profile_pictures pp
  WHERE pp.profile_id = p_profile_id
    AND pp.profile_type = p_profile_type
  ORDER BY pp.display_order;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_profile_pictures_admin(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_profile_pictures_admin(UUID, TEXT) TO anon;

-- Test the function
SELECT * FROM get_profile_pictures_admin('8de9b54f-fbeb-4b76-a282-97978f96c84f'::uuid, 'escort');


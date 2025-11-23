-- Test script to debug RLS policy issues
-- Run this to check if the policies are working correctly

-- Test 1: Check if user can see their own profile
-- Replace 'YOUR_USER_ID' with an actual user ID from auth.users
SELECT 
  'Escort Profile Check' as test_name,
  id,
  user_id,
  first_name,
  last_name
FROM escort_profiles
WHERE user_id = auth.uid()
LIMIT 1;

-- Test 2: Check if profile_pictures table exists and has RLS enabled
SELECT 
  'RLS Status' as test_name,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profile_pictures';

-- Test 3: List all policies on profile_pictures
SELECT 
  'Policy Check' as test_name,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profile_pictures';

-- Test 4: Test the helper function (if using v2 fix)
-- Replace 'PROFILE_ID' with an actual profile ID
-- SELECT user_owns_profile('PROFILE_ID'::uuid, 'escort');

-- Test 5: Check current user
SELECT 
  'Current User' as test_name,
  auth.uid() as user_id,
  auth.email() as email;


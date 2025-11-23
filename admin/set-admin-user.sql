-- Set Admin Status for a User
-- This SQL script directly updates a user's app_metadata to make them an admin
-- 
-- INSTRUCTIONS:
-- 1. Find the user's email or ID from Authentication → Users in Supabase Dashboard
-- 2. Replace 'user-email@example.com' below with the actual email
-- 3. Run this SQL in the Supabase SQL Editor

-- Method 1: Update by Email (Easier - use this if you know the email)
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb
WHERE email = 'user-email@example.com';

-- Method 2: Update by User ID (Use this if you have the UUID)
-- First, find the user ID from Authentication → Users → Click on user → Copy the UUID
-- Then uncomment and replace 'user-id-here' with the actual UUID:
-- UPDATE auth.users
-- SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb
-- WHERE id = 'user-id-here';

-- Verify the update worked:
SELECT 
  id,
  email,
  raw_app_meta_data->>'is_admin' as is_admin,
  raw_app_meta_data as full_metadata
FROM auth.users
WHERE email = 'user-email@example.com';

-- To remove admin status (if needed):
-- UPDATE auth.users
-- SET raw_app_meta_data = raw_app_meta_data - 'is_admin'
-- WHERE email = 'user-email@example.com';


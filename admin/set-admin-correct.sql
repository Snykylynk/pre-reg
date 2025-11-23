-- CORRECTED: Set Admin Status for cloud.architect@ezyy.cloud
-- Run this in Supabase SQL Editor

-- Method 1: Merge with existing metadata (preserves provider info)
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"is_admin": true}'::jsonb
WHERE email = 'cloud.architect@ezyy.cloud';

-- Verify it worked - should show is_admin: true
SELECT 
  email,
  raw_app_meta_data->>'is_admin' as is_admin,
  raw_app_meta_data
FROM auth.users
WHERE email = 'cloud.architect@ezyy.cloud';

-- If Method 1 doesn't work, try Method 2 (explicit merge):
-- UPDATE auth.users
-- SET raw_app_meta_data = jsonb_build_object(
--   'provider', raw_app_meta_data->>'provider',
--   'providers', raw_app_meta_data->'providers',
--   'is_admin', true
-- )
-- WHERE email = 'cloud.architect@ezyy.cloud';


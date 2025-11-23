-- Fix: Set Admin Status for cloud.architect@ezyy.cloud
-- This will properly merge the is_admin flag with existing metadata

-- Step 1: Update the user's app_metadata
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"is_admin": true}'::jsonb
WHERE email = 'cloud.architect@ezyy.cloud';

-- Step 2: Verify it worked (should show is_admin: true)
SELECT 
  id,
  email,
  raw_app_meta_data->>'is_admin' as is_admin,
  raw_app_meta_data as full_metadata
FROM auth.users
WHERE email = 'cloud.architect@ezyy.cloud';

-- If the above doesn't work, try this alternative (replaces entire metadata):
-- UPDATE auth.users
-- SET raw_app_meta_data = '{"provider": "email", "providers": ["email"], "is_admin": true}'::jsonb
-- WHERE email = 'cloud.architect@ezyy.cloud';


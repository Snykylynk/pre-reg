# Fix RLS and Storage Issues

This guide fixes the 403 Forbidden and storage RLS violation errors.

## Issues Fixed

1. ✅ Meta tag deprecation warning
2. ✅ 403 Forbidden when selecting profile pictures
3. ✅ Storage RLS violation when uploading images

## Step 1: Fix RLS Policies

Run `fix-profile-pictures-rls-v3.sql` in your Supabase SQL Editor. This version:
- Checks that `auth.uid() IS NOT NULL` before allowing operations
- Uses direct EXISTS subqueries (more reliable than functions)
- Handles both escort and taxi profiles

## Step 2: Set Up Storage Bucket Policies

**IMPORTANT:** You must set up storage policies for the buckets to work!

1. **Create the buckets** (if not already created):
   - Go to Storage in Supabase Dashboard
   - Create `profile-pictures` bucket (set to Public)
   - Create `gallery-pictures` bucket (set to Public)

2. **Run the storage policies SQL**:
   - Run `setup-storage-policies.sql` in your Supabase SQL Editor
   - This creates policies that allow:
     - Users to upload to their own folder (`{user_id}/filename`)
     - Anyone to view images (public buckets)
     - Users to update/delete their own images

## Step 3: Verify Bucket Configuration

Make sure both buckets are:
- ✅ **Public** (not private)
- ✅ Have RLS enabled
- ✅ Have the policies from step 2 applied

## Step 4: Test

After running both SQL files:
1. Try viewing your profile - gallery images should load
2. Try uploading a profile picture - should work without RLS errors
3. Try uploading gallery pictures - should work without RLS errors

## Troubleshooting

### Still getting 403 on SELECT?
- Check that `auth.uid()` is not null (user is logged in)
- Verify the profile belongs to the current user
- Check that the RLS policies were created successfully

### Still getting storage RLS violation?
- Verify buckets are set to **Public**
- Check that storage policies were created
- Ensure file path follows pattern: `{user_id}/filename`
- Check browser console for exact error message

### Storage policies not working?
- Make sure you're using the correct bucket names
- Verify the folder structure matches: `{user_id}/filename`
- Check that RLS is enabled on the storage.objects table

## Quick Test Query

Run this to verify your user can see their profile:

```sql
-- Replace with your actual user ID
SELECT 
  auth.uid() as current_user_id,
  id as profile_id,
  first_name,
  last_name
FROM escort_profiles
WHERE user_id = auth.uid()
LIMIT 1;
```

If this returns null, the user is not authenticated or doesn't have a profile.


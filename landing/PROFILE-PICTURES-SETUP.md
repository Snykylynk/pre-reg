# Profile Pictures Setup Guide

This guide explains how to set up Supabase Storage for profile pictures and gallery images.

## Prerequisites

1. A Supabase project with the database schema applied
2. Access to your Supabase project dashboard

## Steps to Set Up Storage

### 1. Create Storage Buckets

1. **Open your Supabase project dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to Storage**
   - Click on "Storage" in the left sidebar
   - Click "New bucket"

3. **Create `profile-pictures` bucket**
   - Name: `profile-pictures`
   - Public: **Yes** (checked)
   - File size limit: 5 MB (or your preferred limit)
   - Allowed MIME types: `image/*`
   - Click "Create bucket"

4. **Create `gallery-pictures` bucket**
   - Name: `gallery-pictures`
   - Public: **Yes** (checked)
   - File size limit: 5 MB (or your preferred limit)
   - Allowed MIME types: `image/*`
   - Click "Create bucket"

### 2. Set Up Storage Policies

After creating the buckets, you need to set up Row Level Security (RLS) policies:

#### For `profile-pictures` bucket:

1. Go to Storage → `profile-pictures` → Policies
2. Click "New Policy"
3. Create the following policies:

**Policy 1: Users can upload their own profile pictures**
- Policy name: `Users can upload own profile pictures`
- Allowed operation: `INSERT`
- Policy definition:
```sql
(bucket_id = 'profile-pictures'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])
```

**Policy 2: Users can view all profile pictures**
- Policy name: `Anyone can view profile pictures`
- Allowed operation: `SELECT`
- Policy definition:
```sql
bucket_id = 'profile-pictures'::text
```

**Policy 3: Users can update their own profile pictures**
- Policy name: `Users can update own profile pictures`
- Allowed operation: `UPDATE`
- Policy definition:
```sql
(bucket_id = 'profile-pictures'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])
```

**Policy 4: Users can delete their own profile pictures**
- Policy name: `Users can delete own profile pictures`
- Allowed operation: `DELETE`
- Policy definition:
```sql
(bucket_id = 'profile-pictures'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])
```

#### For `gallery-pictures` bucket:

Apply the same policies as above, but replace `profile-pictures` with `gallery-pictures` in the bucket_id checks.

### 3. Run Database Migration

Run the SQL migration file to create the `profile_pictures` table:

1. Go to SQL Editor in Supabase
2. Open the file `add-profile-pictures.sql`
3. Copy and paste the contents
4. Click "Run"

This will:
- Add `profile_image_url` column to `taxi_owner_profiles` table
- Create `profile_pictures` table for gallery images
- Set up RLS policies for the new table
- Create triggers to enforce max 5 pictures per profile

## Features

### Profile Pictures
- Users can upload one profile picture during registration or from their profile
- Profile pictures are displayed in:
  - User profile pages
  - Admin dashboard rows (as thumbnails)
  - Admin profile modals

### Gallery Pictures
- Users can upload up to 5 gallery pictures
- For escorts: Pictures of themselves
- For taxis: Pictures of their vehicles
- Gallery pictures are displayed in:
  - User profile pages
  - Admin profile modals

## File Structure

Files are stored in Supabase Storage with the following structure:
```
profile-pictures/
  {user_id}/
    {timestamp}.{ext}

gallery-pictures/
  {user_id}/
    {timestamp}-{random}.{ext}
```

## Troubleshooting

### Images not uploading
- Check that buckets are set to public
- Verify RLS policies are correctly configured
- Check browser console for errors

### Images not displaying
- Verify the bucket is public
- Check that the image URLs are correct
- Ensure the SELECT policy allows public access

### "Maximum of 5 pictures" error
- This is enforced by a database trigger
- Users must delete existing pictures before adding new ones
- The limit is set in the `check_max_profile_pictures()` function

## Security Notes

- Profile pictures are stored in user-specific folders
- RLS policies ensure users can only modify their own images
- Admin users can view all images through the admin dashboard
- Public buckets allow images to be displayed without authentication


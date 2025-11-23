-- Storage Bucket Policies for profile-pictures and gallery-pictures
-- Run this in your Supabase SQL Editor after creating the buckets

-- Policy for profile-pictures bucket
-- Users can upload to their own folder
CREATE POLICY "Users can upload own profile pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Anyone can view profile pictures (public bucket)
CREATE POLICY "Anyone can view profile pictures"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

-- Users can update their own profile pictures
CREATE POLICY "Users can update own profile pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own profile pictures
CREATE POLICY "Users can delete own profile pictures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for gallery-pictures bucket
-- Users can upload to their own folder
CREATE POLICY "Users can upload own gallery pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gallery-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Anyone can view gallery pictures (public bucket)
CREATE POLICY "Anyone can view gallery pictures"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gallery-pictures');

-- Users can update their own gallery pictures
CREATE POLICY "Users can update own gallery pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gallery-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'gallery-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own gallery pictures
CREATE POLICY "Users can delete own gallery pictures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gallery-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);


-- Migration: Add profile pictures support
-- This adds profile_image_url to taxi_owner_profiles and creates a profile_pictures table

-- Add profile_image_url to taxi_owner_profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'taxi_owner_profiles' 
    AND column_name = 'profile_image_url'
  ) THEN
    ALTER TABLE taxi_owner_profiles ADD COLUMN profile_image_url TEXT;
  END IF;
END $$;

-- Create profile_pictures table to store gallery pictures (up to 5 per profile)
-- Note: We use a trigger to validate foreign keys since we can't have two foreign keys on the same column
CREATE TABLE IF NOT EXISTS profile_pictures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL,
  profile_type TEXT NOT NULL CHECK (profile_type IN ('escort', 'taxi')),
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profile_pictures_profile_id ON profile_pictures(profile_id, profile_type);
CREATE INDEX IF NOT EXISTS idx_profile_pictures_display_order ON profile_pictures(profile_id, profile_type, display_order);

-- Enable Row Level Security (RLS)
ALTER TABLE profile_pictures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profile_pictures
-- Users can view pictures of their own profile
CREATE POLICY "Users can view own profile pictures"
  ON profile_pictures FOR SELECT
  USING (
    (profile_type = 'escort' AND profile_id IN (
      SELECT id FROM escort_profiles WHERE user_id = auth.uid()
    )) OR
    (profile_type = 'taxi' AND profile_id IN (
      SELECT id FROM taxi_owner_profiles WHERE user_id = auth.uid()
    ))
  );

-- Users can insert pictures for their own profile
CREATE POLICY "Users can insert own profile pictures"
  ON profile_pictures FOR INSERT
  WITH CHECK (
    (profile_type = 'escort' AND profile_id IN (
      SELECT id FROM escort_profiles WHERE user_id = auth.uid()
    )) OR
    (profile_type = 'taxi' AND profile_id IN (
      SELECT id FROM taxi_owner_profiles WHERE user_id = auth.uid()
    ))
  );

-- Users can update pictures of their own profile
CREATE POLICY "Users can update own profile pictures"
  ON profile_pictures FOR UPDATE
  USING (
    (profile_type = 'escort' AND profile_id IN (
      SELECT id FROM escort_profiles WHERE user_id = auth.uid()
    )) OR
    (profile_type = 'taxi' AND profile_id IN (
      SELECT id FROM taxi_owner_profiles WHERE user_id = auth.uid()
    ))
  )
  WITH CHECK (
    (profile_type = 'escort' AND profile_id IN (
      SELECT id FROM escort_profiles WHERE user_id = auth.uid()
    )) OR
    (profile_type = 'taxi' AND profile_id IN (
      SELECT id FROM taxi_owner_profiles WHERE user_id = auth.uid()
    ))
  );

-- Users can delete pictures of their own profile
CREATE POLICY "Users can delete own profile pictures"
  ON profile_pictures FOR DELETE
  USING (
    (profile_type = 'escort' AND profile_id IN (
      SELECT id FROM escort_profiles WHERE user_id = auth.uid()
    )) OR
    (profile_type = 'taxi' AND profile_id IN (
      SELECT id FROM taxi_owner_profiles WHERE user_id = auth.uid()
    ))
  );

-- Admin can view all profile pictures (for admin dashboard)
CREATE POLICY "Admins can view all profile pictures"
  ON profile_pictures FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Trigger to update updated_at on row update
CREATE TRIGGER update_profile_pictures_updated_at
  BEFORE UPDATE ON profile_pictures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to validate profile_id exists in the correct table
CREATE OR REPLACE FUNCTION validate_profile_picture()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.profile_type = 'escort' THEN
    IF NOT EXISTS (SELECT 1 FROM escort_profiles WHERE id = NEW.profile_id) THEN
      RAISE EXCEPTION 'Profile ID does not exist in escort_profiles';
    END IF;
  ELSIF NEW.profile_type = 'taxi' THEN
    IF NOT EXISTS (SELECT 1 FROM taxi_owner_profiles WHERE id = NEW.profile_id) THEN
      RAISE EXCEPTION 'Profile ID does not exist in taxi_owner_profiles';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to enforce max 5 pictures per profile
CREATE OR REPLACE FUNCTION check_max_profile_pictures()
RETURNS TRIGGER AS $$
DECLARE
  picture_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO picture_count
  FROM profile_pictures
  WHERE profile_id = NEW.profile_id AND profile_type = NEW.profile_type;
  
  IF picture_count >= 5 THEN
    RAISE EXCEPTION 'Maximum of 5 pictures allowed per profile';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER validate_profile_picture_trigger
  BEFORE INSERT OR UPDATE ON profile_pictures
  FOR EACH ROW
  EXECUTE FUNCTION validate_profile_picture();

CREATE TRIGGER enforce_max_profile_pictures
  BEFORE INSERT ON profile_pictures
  FOR EACH ROW
  EXECUTE FUNCTION check_max_profile_pictures();


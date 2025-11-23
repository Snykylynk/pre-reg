-- Fix for RLS Policy Issue During Signup
-- Run this SQL in your Supabase SQL Editor to fix the RLS policy issue

-- Drop existing policies if they exist (optional - only if you want to recreate them)
-- DROP POLICY IF EXISTS "Users can insert own escort profile" ON escort_profiles;
-- DROP POLICY IF EXISTS "Users can insert own taxi profile" ON taxi_owner_profiles;

-- Create a function to insert escort profile (bypasses RLS during signup)
CREATE OR REPLACE FUNCTION create_escort_profile(
  p_user_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_date_of_birth DATE,
  p_gender TEXT,
  p_location TEXT,
  p_languages TEXT[] DEFAULT '{}',
  p_services TEXT[] DEFAULT '{}',
  p_hourly_rate DECIMAL(10, 2) DEFAULT NULL,
  p_availability TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_id UUID;
BEGIN
  INSERT INTO escort_profiles (
    user_id,
    first_name,
    last_name,
    email,
    phone,
    date_of_birth,
    gender,
    location,
    languages,
    services,
    hourly_rate,
    availability,
    bio,
    verified
  ) VALUES (
    p_user_id,
    p_first_name,
    p_last_name,
    p_email,
    p_phone,
    p_date_of_birth,
    p_gender,
    p_location,
    p_languages,
    p_services,
    p_hourly_rate,
    p_availability,
    p_bio,
    false
  )
  RETURNING id INTO profile_id;
  
  RETURN profile_id;
END;
$$;

-- Create a function to insert taxi owner profile (bypasses RLS during signup)
CREATE OR REPLACE FUNCTION create_taxi_owner_profile(
  p_user_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_license_number TEXT,
  p_business_name TEXT DEFAULT NULL,
  p_vehicle_make TEXT DEFAULT NULL,
  p_vehicle_model TEXT DEFAULT NULL,
  p_vehicle_year INTEGER DEFAULT NULL,
  p_vehicle_color TEXT DEFAULT NULL,
  p_vehicle_registration TEXT DEFAULT NULL,
  p_insurance_provider TEXT DEFAULT NULL,
  p_insurance_policy_number TEXT DEFAULT NULL,
  p_service_areas TEXT[] DEFAULT '{}',
  p_hourly_rate DECIMAL(10, 2) DEFAULT NULL,
  p_availability TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_id UUID;
BEGIN
  INSERT INTO taxi_owner_profiles (
    user_id,
    first_name,
    last_name,
    email,
    phone,
    business_name,
    license_number,
    vehicle_make,
    vehicle_model,
    vehicle_year,
    vehicle_color,
    vehicle_registration,
    insurance_provider,
    insurance_policy_number,
    service_areas,
    hourly_rate,
    availability,
    verified
  ) VALUES (
    p_user_id,
    p_first_name,
    p_last_name,
    p_email,
    p_phone,
    p_business_name,
    p_license_number,
    p_vehicle_make,
    p_vehicle_model,
    p_vehicle_year,
    p_vehicle_color,
    p_vehicle_registration,
    p_insurance_provider,
    p_insurance_policy_number,
    p_service_areas,
    p_hourly_rate,
    p_availability,
    false
  )
  RETURNING id INTO profile_id;
  
  RETURN profile_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_escort_profile TO authenticated;
GRANT EXECUTE ON FUNCTION create_taxi_owner_profile TO authenticated;
GRANT EXECUTE ON FUNCTION create_escort_profile TO anon;
GRANT EXECUTE ON FUNCTION create_taxi_owner_profile TO anon;


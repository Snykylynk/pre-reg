-- Additional fix for foreign key constraint issues
-- This updates the database functions to handle cases where the user might not be immediately available

-- Drop and recreate the function with better error handling
DROP FUNCTION IF EXISTS create_taxi_owner_profile;

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
  retry_count INTEGER := 0;
  max_retries INTEGER := 5;
  user_exists BOOLEAN := FALSE;
BEGIN
  -- Ensure the user exists in auth.users table (eventual consistency)
  WHILE retry_count < max_retries LOOP
    SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) INTO user_exists;
    IF user_exists THEN
      EXIT;
    END IF;
    RAISE NOTICE 'User % not found in auth.users, retrying...', p_user_id;
    PERFORM pg_sleep(0.5); -- Wait for 0.5 seconds
    retry_count := retry_count + 1;
  END LOOP;

  IF NOT user_exists THEN
    RAISE EXCEPTION 'User with ID % not found in auth.users after % retries. Cannot create profile.', p_user_id, max_retries;
  END IF;
  
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
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    business_name = EXCLUDED.business_name,
    license_number = EXCLUDED.license_number,
    vehicle_make = EXCLUDED.vehicle_make,
    vehicle_model = EXCLUDED.vehicle_model,
    vehicle_year = EXCLUDED.vehicle_year,
    vehicle_color = EXCLUDED.vehicle_color,
    vehicle_registration = EXCLUDED.vehicle_registration,
    insurance_provider = EXCLUDED.insurance_provider,
    insurance_policy_number = EXCLUDED.insurance_policy_number,
    service_areas = EXCLUDED.service_areas,
    hourly_rate = EXCLUDED.hourly_rate,
    availability = EXCLUDED.availability,
    updated_at = NOW()
  RETURNING id INTO profile_id;
  
  RETURN profile_id;
END;
$$;

-- Drop and recreate escort profile function with same improvements
DROP FUNCTION IF EXISTS create_escort_profile;

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
  retry_count INTEGER := 0;
  max_retries INTEGER := 5;
  user_exists BOOLEAN := FALSE;
BEGIN
  -- Ensure the user exists in auth.users table (eventual consistency)
  WHILE retry_count < max_retries LOOP
    SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) INTO user_exists;
    IF user_exists THEN
      EXIT;
    END IF;
    RAISE NOTICE 'User % not found in auth.users, retrying...', p_user_id;
    PERFORM pg_sleep(0.5); -- Wait for 0.5 seconds
    retry_count := retry_count + 1;
  END LOOP;

  IF NOT user_exists THEN
    RAISE EXCEPTION 'User with ID % not found in auth.users after % retries. Cannot create profile.', p_user_id, max_retries;
  END IF;
  
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
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    date_of_birth = EXCLUDED.date_of_birth,
    gender = EXCLUDED.gender,
    location = EXCLUDED.location,
    languages = EXCLUDED.languages,
    services = EXCLUDED.services,
    hourly_rate = EXCLUDED.hourly_rate,
    availability = EXCLUDED.availability,
    bio = EXCLUDED.bio,
    updated_at = NOW()
  RETURNING id INTO profile_id;
  
  RETURN profile_id;
END;
$$;

-- Create a function to check if email exists in auth.users
CREATE OR REPLACE FUNCTION check_email_in_auth(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  email_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = LOWER(TRIM(p_email))
  ) INTO email_exists;
  
  RETURN email_exists;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_escort_profile TO authenticated;
GRANT EXECUTE ON FUNCTION create_taxi_owner_profile TO authenticated;
GRANT EXECUTE ON FUNCTION create_escort_profile TO anon;
GRANT EXECUTE ON FUNCTION create_taxi_owner_profile TO anon;
GRANT EXECUTE ON FUNCTION check_email_in_auth TO authenticated;
GRANT EXECUTE ON FUNCTION check_email_in_auth TO anon;


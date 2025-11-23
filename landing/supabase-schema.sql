-- Snyky Lynk Database Schema
-- Run this SQL in your Supabase SQL Editor to create the required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Escort Profiles Table
CREATE TABLE IF NOT EXISTS escort_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL,
  location TEXT NOT NULL,
  languages TEXT[] DEFAULT '{}',
  services TEXT[] DEFAULT '{}',
  hourly_rate DECIMAL(10, 2),
  availability TEXT,
  bio TEXT,
  profile_image_url TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Taxi Owner Profiles Table
CREATE TABLE IF NOT EXISTS taxi_owner_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  business_name TEXT,
  license_number TEXT NOT NULL,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_year INTEGER,
  vehicle_color TEXT,
  vehicle_registration TEXT,
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  service_areas TEXT[] DEFAULT '{}',
  hourly_rate DECIMAL(10, 2),
  availability TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_escort_profiles_user_id ON escort_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_escort_profiles_email ON escort_profiles(email);
CREATE INDEX IF NOT EXISTS idx_taxi_owner_profiles_user_id ON taxi_owner_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_taxi_owner_profiles_email ON taxi_owner_profiles(email);

-- Enable Row Level Security (RLS)
ALTER TABLE escort_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxi_owner_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for escort_profiles
-- Users can view their own profile
CREATE POLICY "Users can view own escort profile"
  ON escort_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own escort profile"
  ON escort_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own escort profile"
  ON escort_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for taxi_owner_profiles
-- Users can view their own profile
CREATE POLICY "Users can view own taxi profile"
  ON taxi_owner_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own taxi profile"
  ON taxi_owner_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own taxi profile"
  ON taxi_owner_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update updated_at on row update
CREATE TRIGGER update_escort_profiles_updated_at
  BEFORE UPDATE ON escort_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_taxi_owner_profiles_updated_at
  BEFORE UPDATE ON taxi_owner_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


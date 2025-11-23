# Database Setup Guide

This guide will help you set up the Supabase database tables for Snyky Lynk.

## Prerequisites

1. A Supabase account and project
2. Access to your Supabase project dashboard

## Steps to Create Tables

### Option 1: Using Supabase SQL Editor (Recommended)

1. **Open your Supabase project dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the schema**
   - Open the file `supabase-schema.sql` in this directory
   - Copy the entire contents
   - Paste it into the SQL Editor
   - Click "Run" or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)

4. **Verify tables were created**
   - Go to "Table Editor" in the left sidebar
   - You should see two new tables:
     - `escort_profiles`
     - `taxi_owner_profiles`

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Make sure you're in the landing directory
cd landing

# Link to your Supabase project (if not already linked)
supabase link --project-ref your-project-ref

# Run the migration
supabase db push
```

## What Gets Created

The schema creates:

1. **Tables:**
   - `escort_profiles` - Stores escort service provider information
   - `taxi_owner_profiles` - Stores taxi owner information

2. **Security:**
   - Row Level Security (RLS) policies enabled
   - Users can only access their own profiles
   - Automatic user_id validation

3. **Indexes:**
   - Indexes on `user_id` and `email` for better query performance

4. **Triggers:**
   - Automatic `updated_at` timestamp updates

## Verification

After running the schema, verify everything is set up correctly:

1. Check that both tables exist in the Table Editor
2. Verify RLS is enabled (should show a lock icon)
3. Test by creating a test profile through the registration form

## Troubleshooting

### Error: "relation already exists"
- The tables may already exist. You can either:
  - Drop the existing tables and recreate them
  - Or modify the schema to use `CREATE TABLE IF NOT EXISTS` (already included)

### Error: "permission denied"
- Make sure you're using the correct database credentials
- Check that your Supabase project has the necessary permissions

### RLS Policies Not Working
- Make sure you're authenticated when testing
- Verify the policies were created correctly in the SQL Editor

## Next Steps

After setting up the database:

1. Make sure your `.env` file has the correct Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. Test the registration forms to ensure data is being saved correctly

3. Check the Supabase dashboard to verify profiles are being created


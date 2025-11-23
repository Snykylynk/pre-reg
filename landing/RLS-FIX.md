# Fix for RLS Policy Violation

If you're getting the error "new row violates row-level security policy for table 'escort_profiles'" or similar, follow these steps:

## Quick Fix

1. **Run the database function fix:**
   - Open your Supabase SQL Editor
   - Copy and paste the contents of `supabase-schema-fix.sql`
   - Execute the query

This creates database functions that can bypass RLS during signup, allowing profile creation even when the session isn't fully established.

## What Changed

The registration forms now:
1. Try to establish a session after signup
2. If direct insert fails due to RLS, automatically fall back to using the database functions
3. Handle cases where email confirmation is required

## Alternative: Disable Email Confirmation (Not Recommended)

If you want users to be immediately authenticated after signup:

1. Go to your Supabase Dashboard
2. Navigate to Authentication → Settings
3. Disable "Enable email confirmations"

**Note:** This is less secure but allows immediate profile creation without the database functions.

## Testing

After applying the fix:
1. Try creating a new escort profile
2. Try creating a new taxi owner profile
3. Both should work regardless of email confirmation settings

The code will automatically use the database functions if RLS blocks the direct insert.


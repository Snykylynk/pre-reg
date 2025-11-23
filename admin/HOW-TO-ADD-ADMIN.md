# How to Add Admin Status to a User

If you can't find the "App Metadata" section in the Supabase dashboard, use one of these methods:

## Method 1: Using SQL (Recommended - Works Every Time)

This is the most reliable method and works regardless of the UI version.

### Step-by-Step:

1. **Get the User's Email**
   - Go to **Authentication** → **Users** in Supabase Dashboard
   - Find the user you want to make an admin
   - Copy their email address

2. **Open SQL Editor**
   - In Supabase Dashboard, click **SQL Editor** in the left sidebar
   - Click **New query**

3. **Run the SQL**
   - Open the file `set-admin-user.sql` in this folder
   - Replace `'user-email@example.com'` with the actual email
   - Copy and paste the SQL into the SQL Editor
   - Click **Run** (or press Ctrl+Enter / Cmd+Enter)

4. **Verify It Worked**
   - The query will show the user's data including `is_admin: true`
   - You should see `is_admin` showing as `true` in the results

### Quick SQL Command:

```sql
-- Replace 'admin@example.com' with the actual email
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb
WHERE email = 'admin@example.com';
```

### To Verify:

```sql
SELECT 
  email,
  raw_app_meta_data->>'is_admin' as is_admin
FROM auth.users
WHERE email = 'admin@example.com';
```

## Method 2: Using User ID (If You Have the UUID)

1. **Get the User ID**
   - Go to **Authentication** → **Users**
   - Click on the user
   - Copy the **UUID** shown (it's a long string like `123e4567-e89b-12d3-a456-426614174000`)

2. **Run SQL with ID**

```sql
-- Replace 'user-id-here' with the actual UUID
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb
WHERE id = 'user-id-here';
```

## Method 3: Supabase Dashboard (If Available)

The UI location may vary by Supabase version. Try these locations:

### Option A: User Details Page
1. **Authentication** → **Users**
2. Click on the user's email
3. Look for:
   - **"Metadata"** tab
   - **"App Metadata"** section
   - **"User Metadata"** → **"App Metadata"**
   - A JSON editor field

### Option B: Edit User Modal
1. **Authentication** → **Users**
2. Click the **three dots** (⋮) or **edit icon** next to the user
3. Look for **"App Metadata"** or **"Metadata"** in the edit form

### Option C: Raw User Data
1. **Authentication** → **Users**
2. Click on the user
3. Look for **"Raw User Data"** or expand all sections
4. Find `app_metadata` in the JSON view

## Method 4: Using Supabase CLI (If Installed)

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Update user metadata (replace email and ensure you have service role key)
supabase db execute "
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{\"is_admin\": true}'::jsonb
WHERE email = 'admin@example.com';
"
```

## Method 5: Programmatic (Server-side Only)

If you have access to the service role key:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ Never use in client code!
)

// By email
const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
const user = users.find(u => u.email === 'admin@example.com')
if (user) {
  await supabaseAdmin.auth.admin.updateUserById(user.id, {
    app_metadata: { is_admin: true }
  })
}

// Or by ID if you know it
await supabaseAdmin.auth.admin.updateUserById('user-id', {
  app_metadata: { is_admin: true }
})
```

## Verify Admin Status

After running any method, verify it worked:

```sql
SELECT 
  email,
  raw_app_meta_data->>'is_admin' as is_admin,
  raw_app_meta_data as full_metadata
FROM auth.users
WHERE email = 'your-admin-email@example.com';
```

You should see `is_admin` as `true`.

## Test the Admin Dashboard

1. Make sure you've run `admin-rls-policies.sql` first
2. Log out of the admin dashboard (if logged in)
3. Log in with the admin user's credentials
4. You should now have access!

## Remove Admin Status (If Needed)

```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data - 'is_admin'
WHERE email = 'user-email@example.com';
```

## Troubleshooting

### "Relation auth.users does not exist"
- Make sure you're running this in the Supabase SQL Editor
- You need proper permissions (this should work with the default setup)

### "Permission denied"
- You need to be the project owner or have admin access
- Try using the SQL Editor in the Supabase Dashboard

### Still can't access admin dashboard
1. Verify the SQL ran successfully (check the query results)
2. Make sure `admin-rls-policies.sql` was run
3. Sign out completely and sign back in
4. Clear browser cache/cookies
5. Check browser console for errors

## Quick Reference

**SQL Command:**
```sql
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb
WHERE email = 'your-email@example.com';
```

**Location:** Supabase Dashboard → SQL Editor → New Query → Paste SQL → Run

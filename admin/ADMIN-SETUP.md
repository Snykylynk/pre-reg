# Admin Dashboard Setup Guide

This guide will help you set up the Snyk Lynk admin dashboard.

## Prerequisites

1. A Supabase account and project
2. Access to your Supabase project dashboard
3. The landing page database schema should already be set up

## Setup Steps

### 1. Install Dependencies

```bash
cd admin
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `admin` directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set Up Database Policies

Run the SQL file `admin-rls-policies.sql` in your Supabase SQL Editor:

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New query**
4. Copy and paste the contents of `admin-rls-policies.sql`
5. Execute the SQL

This will:
- Create a function to check if a user is an admin
- Add RLS policies that allow admins to view and update all profiles

### 4. Create Admin Users

Admin users must be created through the Supabase dashboard with `app_metadata.is_admin = true`.

#### Option A: Create New Admin User via Supabase Dashboard

1. Go to **Authentication** → **Users** in your Supabase dashboard
2. Click **Add user** → **Create new user**
3. Enter email and password
4. In the **User Metadata** section, add to **App Metadata**:
   ```json
   {
     "is_admin": true
   }
   ```
5. Click **Create user**

#### Option B: Convert Existing User to Admin

**Step-by-step instructions:**

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to Users**
   - In the left sidebar, click **Authentication**
   - Click **Users** (you should see a list of all users)

3. **Select the User**
   - Find the user you want to make an admin in the list
   - Click on the user's email or row to open the user details

4. **Edit App Metadata**
   - Scroll down to the **User Metadata** section
   - Look for the **App Metadata** field (it's a JSON editor/text area)
   - If it's empty, it might show `{}` or be blank
   - Replace the contents with:
     ```json
     {
       "is_admin": true
     }
     ```
   - **Important**: Make sure the JSON is valid (proper quotes, commas, etc.)

5. **Save Changes**
   - Click the **Save** or **Update** button (usually at the bottom of the form)
   - You should see a success message

**Visual Guide:**
- The App Metadata field is typically located below the user's basic information
- It's a text area that accepts JSON format
- Make sure there are no syntax errors in your JSON

**Troubleshooting:**
- If you see an error, check that your JSON is valid (use double quotes, not single quotes)
- Make sure there are no trailing commas
- The field should look like: `{"is_admin": true}` (all on one line is fine)

#### Option C: Use Supabase Admin API (Server-side)

If you have access to the service role key, you can use the Admin API:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key, NOT anon key
)

await supabaseAdmin.auth.admin.updateUserById(userId, {
  app_metadata: { is_admin: true }
})
```

### 5. Start Development Server

```bash
npm run dev
```

The admin dashboard will be available at `http://localhost:5173` (or the port shown in the terminal).

## Features

### Overview Page
- Dashboard statistics
- Total escorts and taxis
- Verified counts
- Recent registrations (last 7 days)

### Taxis Page
- View all registered taxi drivers
- Search by name, email, phone, or business name
- Filter by verification status
- Toggle verification status
- View detailed profile information

### Escorts Page
- View all registered escorts
- Search by name, email, phone, or location
- Filter by verification status
- Toggle verification status
- View detailed profile information

## Security

- **Admin-only access**: Only users with `app_metadata.is_admin = true` can access the dashboard
- **RLS Policies**: Database policies ensure admins can read and update all profiles
- **Authentication required**: All routes except `/login` require authentication
- **Automatic redirect**: Non-admin users are redirected to login page

## Troubleshooting

### "Access denied" error
- Verify the user has `app_metadata.is_admin = true` in Supabase
- Check that the RLS policies were applied correctly
- Ensure you're signed in with an admin account

### Cannot see profiles
- Verify the RLS policies were created successfully
- Check that the `is_admin_user()` function exists
- Ensure you're using an admin account

### Login not working
- Verify environment variables are set correctly
- Check that the Supabase URL and anon key are correct
- Ensure the user exists in Supabase Authentication

## Notes

- Ordinary escorts and taxi drivers **cannot** access the admin dashboard
- Admin users are separate from regular users
- Admin status is checked on every page load
- All admin operations are logged in Supabase


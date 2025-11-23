# Email Confirmation Setup

## Current Behavior

By default, Supabase requires users to confirm their email address before they can sign in. This is a security best practice.

## What Happens Now

1. **User Registration:**
   - User signs up and receives a confirmation email
   - Profile is created successfully (even if email isn't confirmed yet)
   - User cannot sign in until email is confirmed

2. **Sign In Attempt:**
   - If email is not confirmed, user sees a helpful error message
   - User can click "Resend Confirmation Email" button
   - After confirming email, user can sign in normally

## Options

### Option 1: Keep Email Confirmation (Recommended for Production)

**Pros:**
- More secure
- Prevents fake email addresses
- Industry standard

**User Experience:**
- Users must check their email and click the confirmation link
- The sign-in page now has a "Resend Confirmation Email" button if needed

### Option 2: Disable Email Confirmation (For Development Only)

If you want to disable email confirmation for development/testing:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Settings**
3. Find **"Enable email confirmations"**
4. Toggle it **OFF**
5. Save changes

**⚠️ Warning:** Only disable this for development. In production, email confirmation is important for security.

## Testing Email Confirmation

1. **Check your email inbox** after registration
2. Look for an email from Supabase
3. Click the confirmation link in the email
4. Try signing in again

## Troubleshooting

### Email Not Received

1. Check spam/junk folder
2. Verify the email address is correct
3. Use the "Resend Confirmation Email" button on the sign-in page
4. Check Supabase dashboard → Authentication → Users to see if the user exists

### Confirmation Link Expired

- Request a new confirmation email using the resend button
- The link typically expires after 24 hours

### Still Having Issues?

- Check Supabase logs in the dashboard
- Verify email settings in Supabase project settings
- Make sure your email provider isn't blocking Supabase emails


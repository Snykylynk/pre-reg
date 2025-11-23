import { supabase } from './supabase'

export async function checkEmailUniqueness(email: string): Promise<{ isUnique: boolean; message?: string }> {
  if (!email || !email.includes('@')) {
    return { isUnique: true } // Don't check if email is invalid format
  }

  const normalizedEmail = email.toLowerCase().trim()

  try {
    // First, check if email exists in auth.users table
    const { data: emailInAuth, error: authCheckError } = await supabase.rpc('check_email_in_auth', {
      p_email: normalizedEmail,
    })

    if (authCheckError) {
      console.error('Error checking auth.users:', authCheckError)
    }

    if (emailInAuth === true) {
      return {
        isUnique: false,
        message: 'This email is already registered. Please use a different email or sign in.',
      }
    }

    // Check in escort_profiles
    const { data: escortProfile, error: escortError } = await supabase
      .from('escort_profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (escortError && escortError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is fine
      console.error('Error checking escort profiles:', escortError)
    }

    // Check in taxi_owner_profiles
    const { data: taxiProfile, error: taxiError } = await supabase
      .from('taxi_owner_profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (taxiError && taxiError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is fine
      console.error('Error checking taxi profiles:', taxiError)
    }

    if (escortProfile || taxiProfile) {
      return {
        isUnique: false,
        message: 'This email is already registered. Please use a different email or sign in.',
      }
    }

    return { isUnique: true }
  } catch (error) {
    console.error('Error checking email uniqueness:', error)
    // If there's an error, allow the user to continue (fail open)
    // The database constraint will catch duplicates anyway
    return { isUnique: true }
  }
}


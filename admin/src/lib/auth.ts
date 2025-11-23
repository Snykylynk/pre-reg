import { supabase } from './supabase'

/**
 * Check if the current user is an admin
 * Admin status is determined by app_metadata.is_admin === true
 * This is set via Supabase dashboard or through seeding
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return false
    }

    // Check if user has admin role in app_metadata
    // Admins are created through Supabase dashboard with app_metadata: { is_admin: true }
    const isAdminUser = user.app_metadata?.is_admin === true
    
    return isAdminUser
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}


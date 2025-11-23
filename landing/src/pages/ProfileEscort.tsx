import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EditableField } from '@/components/EditableField'
import { LogOut } from 'lucide-react'
import type { EscortProfile, ProfilePicture } from '@/lib/types'
import { LANGUAGES, ESCORT_SERVICES, AVAILABILITY_OPTIONS, SOUTH_AFRICAN_CITIES } from '@/lib/constants'
import { ImageUpload } from '@/components/ImageUpload'
import { GalleryUpload } from '@/components/GalleryUpload'

export default function ProfileEscort() {
  const [profile, setProfile] = useState<EscortProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [galleryImages, setGalleryImages] = useState<ProfilePicture[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/signin')
        return
      }

      setUserId(user.id)

      const { data, error: fetchError } = await supabase
        .from('escort_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError) throw fetchError
      setProfile(data)

      // Load gallery images
      if (data.id) {
        const { data: galleryData, error: galleryError } = await supabase
          .from('profile_pictures')
          .select('*')
          .eq('profile_id', data.id)
          .eq('profile_type', 'escort')
          .order('display_order')

        if (!galleryError && galleryData) {
          setGalleryImages(galleryData)
        }
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const updateField = async (field: keyof EscortProfile, value: any) => {
    if (!profile) return

    try {
      const { error: updateError } = await supabase
        .from('escort_profiles')
        .update({
          [field]: value,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (updateError) throw updateError

      // Update local state
      setProfile(prev => prev ? { ...prev, [field]: value } : null)
    } catch (err: any) {
      setError(err.message ?? 'Failed to update field')
      throw err
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Profile not found</p>
            <Button onClick={() => navigate('/prereg')} className="mt-4">
              Register
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Escort Profile</h1>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            <EditableField
              label="First Name"
              value={profile.first_name}
              onSave={(value) => updateField('first_name', value)}
            />
            <EditableField
              label="Last Name"
              value={profile.last_name}
              onSave={(value) => updateField('last_name', value)}
            />
            <EditableField
              label="Email"
              value={profile.email}
              type="email"
              onSave={(value) => updateField('email', value)}
            />
            <EditableField
              label="Phone"
              value={profile.phone}
              type="tel"
              onSave={(value) => updateField('phone', value)}
            />
            <EditableField
              label="Date of Birth"
              value={profile.date_of_birth}
              type="date"
              onSave={(value) => updateField('date_of_birth', value)}
            />
            <EditableField
              label="Gender"
              value={profile.gender}
              type="select"
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'non-binary', label: 'Non-binary' },
                { value: 'other', label: 'Other' },
              ]}
              onSave={(value) => updateField('gender', value)}
            />
            <EditableField
              label="Location (City)"
              value={profile.location}
              type="select"
              options={SOUTH_AFRICAN_CITIES}
              onSave={(value) => updateField('location', value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Professional Details</CardTitle>
            <CardDescription>Your professional information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            <EditableField
              label="Languages"
              value={profile.languages ?? []}
              type="multiselect"
              options={LANGUAGES}
              onSave={async (value) => {
                await updateField('languages', Array.isArray(value) ? value : [])
              }}
            />
            <EditableField
              label="Services"
              value={profile.services ?? []}
              type="multiselect"
              options={ESCORT_SERVICES}
              onSave={async (value) => {
                await updateField('services', Array.isArray(value) ? value : [])
              }}
            />
            <EditableField
              label="Hourly Rate (USD)"
              value={profile.hourly_rate}
              type="number"
              formatValue={(value) => value ? `$${value}` : 'Not set'}
              onSave={(value) => updateField('hourly_rate', value)}
            />
            <EditableField
              label="Availability"
              value={profile.availability ? profile.availability.split(', ').filter(Boolean) : []}
              type="multiselect"
              options={AVAILABILITY_OPTIONS}
              onSave={async (value) => {
                const days = Array.isArray(value) ? value : []
                await updateField('availability', days.length > 0 ? days.join(', ') : null)
              }}
            />
            <EditableField
              label="Bio"
              value={profile.bio}
              type="textarea"
              placeholder="Tell us about yourself..."
              rows={4}
              onSave={(value) => updateField('bio', value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pictures</CardTitle>
            <CardDescription>Manage your profile picture and gallery</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {userId && (
              <ImageUpload
                currentImageUrl={profile.profile_image_url}
                onUpload={async (url) => {
                  await updateField('profile_image_url', url)
                }}
                label="Profile Picture"
                bucket="profile-pictures"
                userId={userId}
              />
            )}
            {profile.id && (
              <GalleryUpload
                profileId={profile.id}
                profileType="escort"
                currentImages={galleryImages}
                onUpdate={async () => {
                  await loadProfile()
                }}
                maxImages={5}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

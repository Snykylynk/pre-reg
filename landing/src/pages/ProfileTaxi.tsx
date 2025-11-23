import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EditableField } from '@/components/EditableField'
import { LogOut } from 'lucide-react'
import type { TaxiOwnerProfile } from '@/lib/types'
import { VEHICLE_MAKES, VEHICLE_YEARS, SERVICE_AREAS, AVAILABILITY_OPTIONS } from '@/lib/constants'

export default function ProfileTaxi() {
  const [profile, setProfile] = useState<TaxiOwnerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

      const { data, error: fetchError } = await supabase
        .from('taxi_owner_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError) throw fetchError
      setProfile(data)
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

  const updateField = async (field: keyof TaxiOwnerProfile, value: any) => {
    if (!profile) return

    try {
      const { error: updateError } = await supabase
        .from('taxi_owner_profiles')
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
          <h1 className="text-3xl font-bold">Taxi Owner Profile</h1>
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
              label="Business Name"
              value={profile.business_name}
              placeholder="Optional"
              onSave={(value) => updateField('business_name', value)}
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
            <CardDescription>Your vehicle details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            <EditableField
              label="Driver's License Number"
              value={profile.license_number}
              onSave={(value) => updateField('license_number', value)}
            />
            <EditableField
              label="Vehicle Make"
              value={profile.vehicle_make}
              type="select"
              options={VEHICLE_MAKES}
              onSave={(value) => updateField('vehicle_make', value)}
            />
            <EditableField
              label="Vehicle Model"
              value={profile.vehicle_model}
              placeholder="e.g., Camry"
              onSave={(value) => updateField('vehicle_model', value)}
            />
            <EditableField
              label="Vehicle Year"
              value={profile.vehicle_year?.toString()}
              type="select"
              options={VEHICLE_YEARS}
              onSave={(value) => updateField('vehicle_year', value ? parseInt(value as string) : null)}
            />
            <EditableField
              label="Vehicle Color"
              value={profile.vehicle_color}
              onSave={(value) => updateField('vehicle_color', value)}
            />
            <EditableField
              label="Vehicle Registration Number"
              value={profile.vehicle_registration}
              onSave={(value) => updateField('vehicle_registration', value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Details</CardTitle>
            <CardDescription>Your business information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            <EditableField
              label="Insurance Provider"
              value={profile.insurance_provider}
              placeholder="Optional"
              onSave={(value) => updateField('insurance_provider', value)}
            />
            <EditableField
              label="Insurance Policy Number"
              value={profile.insurance_policy_number}
              placeholder="Optional"
              onSave={(value) => updateField('insurance_policy_number', value)}
            />
            <EditableField
              label="Service Areas"
              value={profile.service_areas ?? []}
              type="multiselect"
              options={SERVICE_AREAS}
              onSave={async (value) => {
                await updateField('service_areas', Array.isArray(value) ? value : [])
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

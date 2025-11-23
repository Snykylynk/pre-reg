import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MultiSelect } from '@/components/MultiSelect'
import { Combobox } from '@/components/Combobox'
import { ArrowLeft, ArrowRight, Check, X, Plus } from 'lucide-react'
import type { TaxiOwnerProfile } from '@/lib/types'
import { validateTaxiStep1, validateTaxiStep2, validateTaxiStep3, type ValidationError } from '@/lib/validation'
import { VEHICLE_MAKES, VEHICLE_YEARS, SERVICE_AREAS, AVAILABILITY_OPTIONS } from '@/lib/constants'
import { checkEmailUniqueness } from '@/lib/emailCheck'
import { ImageUpload } from '@/components/ImageUpload'

const STEPS = [
  'Personal Information',
  'Contact Details',
  'Vehicle Information',
  'Business Details',
  'Pictures',
  'Review & Submit'
]

export default function RegisterTaxi() {
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const navigate = useNavigate()

  const [formData, setFormData] = useState<Partial<TaxiOwnerProfile>>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    business_name: '',
    license_number: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: undefined,
    vehicle_color: '',
    vehicle_registration: '',
    insurance_provider: '',
    insurance_policy_number: '',
    service_areas: [],
    hourly_rate: undefined,
    availability: '',
  })

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [availabilityDays, setAvailabilityDays] = useState<string[]>([])
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  const [galleryImages, setGalleryImages] = useState<Array<{ id?: string; image_url: string; display_order: number }>>([])
  const [userId, setUserId] = useState<string | null>(null)

  // Get user ID when moving to pictures step or when user is available
  useEffect(() => {
    const getUser = async () => {
      if (currentStep === 4 || !userId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
        }
      }
    }
    getUser()
  }, [currentStep, userId])

  const updateFormData = (field: keyof TaxiOwnerProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = async () => {
    setFieldErrors({})
    let errors: ValidationError[] = []

    if (currentStep === 0) {
      errors = validateTaxiStep1(formData)
    } else if (currentStep === 1) {
      errors = validateTaxiStep2(formData, password, confirmPassword)
      
      // Check email uniqueness before proceeding
      if (formData.email && !errors.find(e => e.field === 'email')) {
        setCheckingEmail(true)
        const emailCheck = await checkEmailUniqueness(formData.email)
        if (!emailCheck.isUnique) {
          errors.push({
            field: 'email',
            message: emailCheck.message ?? 'This email is already registered',
          })
        }
        setCheckingEmail(false)
      }
    } else if (currentStep === 2) {
      errors = validateTaxiStep3(formData)
    }

    if (errors.length > 0) {
      const errorMap: Record<string, string> = {}
      errors.forEach(err => {
        errorMap[err.field] = err.message
      })
      setFieldErrors(errorMap)
      return
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match')
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email!,
        password,
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Failed to create user account')
      }

      setUserId(authData.user.id)

      // Wait a moment to ensure the user is fully committed to auth.users
      await new Promise(resolve => setTimeout(resolve, 500))

      // Always use the database function to avoid foreign key constraint issues
      // The function uses SECURITY DEFINER and can handle cases where the user
      // might not be immediately available in auth.users
      let functionError = null
      let retries = 0
      const maxRetries = 3
      let profileId: string | null = null

      while (retries < maxRetries) {
        const { data: profileData, error: error } = await supabase.rpc('create_taxi_owner_profile', {
          p_user_id: authData.user.id,
          p_first_name: formData.first_name,
          p_last_name: formData.last_name,
          p_email: formData.email,
          p_phone: formData.phone,
          p_business_name: formData.business_name ?? null,
          p_license_number: formData.license_number,
          p_vehicle_make: formData.vehicle_make ?? null,
          p_vehicle_model: formData.vehicle_model ?? null,
          p_vehicle_year: formData.vehicle_year ?? null,
          p_vehicle_color: formData.vehicle_color ?? null,
          p_vehicle_registration: formData.vehicle_registration ?? null,
          p_insurance_provider: formData.insurance_provider ?? null,
          p_insurance_policy_number: formData.insurance_policy_number ?? null,
          p_service_areas: formData.service_areas ?? [],
          p_hourly_rate: formData.hourly_rate ?? null,
          p_availability: availabilityDays.length > 0 ? availabilityDays.join(', ') : null,
        })

        functionError = error

        // If no error, break out of retry loop
        if (!functionError) {
          profileId = profileData
          break
        }

        // If it's a foreign key error, wait and retry
        if (functionError.message?.includes('foreign key') || 
            functionError.code === '23503' ||
            functionError.message?.includes('violates foreign key')) {
          retries++
          if (retries < maxRetries) {
            // Wait progressively longer with each retry
            await new Promise(resolve => setTimeout(resolve, 1000 * retries))
            continue
          }
        }

        // If it's not a foreign key error or we've exhausted retries, throw
        throw functionError
      }

      if (!profileId) {
        // Get profile ID from database
        const { data: profile, error: fetchError } = await supabase
          .from('taxi_owner_profiles')
          .select('id')
          .eq('user_id', authData.user.id)
          .single()
        
        if (fetchError) throw fetchError
        profileId = profile.id
      }

      // Update profile with profile image if provided
      if (profileImageUrl && profileId) {
        const { error: updateError } = await supabase
          .from('taxi_owner_profiles')
          .update({ profile_image_url: profileImageUrl })
          .eq('id', profileId)
        
        if (updateError) {
          console.error('Error updating profile image:', updateError)
          // Don't throw - continue with registration
        }
      }

      // Save gallery images if provided
      if (galleryImages.length > 0 && profileId) {
        const galleryData = galleryImages.map((img, index) => ({
          profile_id: profileId,
          profile_type: 'taxi' as const,
          image_url: img.image_url,
          display_order: index,
        }))

        const { error: galleryError } = await supabase
          .from('profile_pictures')
          .insert(galleryData)

        if (galleryError) {
          console.error('Error saving gallery images:', galleryError)
          // Don't throw - continue with registration
        }
      }

      // Try to sign in if session is available
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email!,
          password,
        })
        if (signInError && !signInError.message?.includes('Email not confirmed')) {
          // If email confirmation is required, just navigate to sign in
          alert('Registration successful! Please check your email to confirm your account, then sign in.')
          navigate('/signin')
          return
        }
      }

      navigate('/profile/taxi')
    } catch (err: any) {
      setError(err.message ?? 'An error occurred during registration')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => {
                    updateFormData('first_name', e.target.value)
                    if (fieldErrors.first_name) {
                      setFieldErrors(prev => {
                        const newErrors = { ...prev }
                        delete newErrors.first_name
                        return newErrors
                      })
                    }
                  }}
                  className={fieldErrors.first_name ? 'border-destructive' : ''}
                  required
                />
                {fieldErrors.first_name && (
                  <p className="text-sm text-destructive">{fieldErrors.first_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => {
                    updateFormData('last_name', e.target.value)
                    if (fieldErrors.last_name) {
                      setFieldErrors(prev => {
                        const newErrors = { ...prev }
                        delete newErrors.last_name
                        return newErrors
                      })
                    }
                  }}
                  className={fieldErrors.last_name ? 'border-destructive' : ''}
                  required
                />
                {fieldErrors.last_name && (
                  <p className="text-sm text-destructive">{fieldErrors.last_name}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name (Optional)</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => updateFormData('business_name', e.target.value)}
              />
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    updateFormData('email', e.target.value)
                    if (fieldErrors.email) {
                      setFieldErrors(prev => {
                        const newErrors = { ...prev }
                        delete newErrors.email
                        return newErrors
                      })
                    }
                  }}
                  onBlur={async (e) => {
                    const email = e.target.value.trim()
                    if (email && email.includes('@')) {
                      setCheckingEmail(true)
                      const result = await checkEmailUniqueness(email)
                      if (!result.isUnique) {
                        setFieldErrors(prev => ({
                          ...prev,
                          email: result.message ?? 'This email is already registered',
                        }))
                      }
                      setCheckingEmail(false)
                    }
                  }}
                  className={fieldErrors.email ? 'border-destructive' : ''}
                  required
                />
                {checkingEmail && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                )}
              </div>
              {fieldErrors.email && (
                <p className="text-sm text-destructive">{fieldErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  updateFormData('phone', e.target.value)
                  if (fieldErrors.phone) {
                    setFieldErrors(prev => {
                      const newErrors = { ...prev }
                      delete newErrors.phone
                      return newErrors
                    })
                  }
                }}
                className={fieldErrors.phone ? 'border-destructive' : ''}
                required
              />
              {fieldErrors.phone && (
                <p className="text-sm text-destructive">{fieldErrors.phone}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (fieldErrors.password) {
                    setFieldErrors(prev => {
                      const newErrors = { ...prev }
                      delete newErrors.password
                      return newErrors
                    })
                  }
                }}
                className={fieldErrors.password ? 'border-destructive' : ''}
                required
              />
              {fieldErrors.password && (
                <p className="text-sm text-destructive">{fieldErrors.password}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors(prev => {
                      const newErrors = { ...prev }
                      delete newErrors.confirmPassword
                      return newErrors
                    })
                  }
                }}
                className={fieldErrors.confirmPassword ? 'border-destructive' : ''}
                required
              />
              {fieldErrors.confirmPassword && (
                <p className="text-sm text-destructive">{fieldErrors.confirmPassword}</p>
              )}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="license_number">Driver's License Number *</Label>
              <Input
                id="license_number"
                value={formData.license_number}
                onChange={(e) => {
                  updateFormData('license_number', e.target.value)
                  if (fieldErrors.license_number) {
                    setFieldErrors(prev => {
                      const newErrors = { ...prev }
                      delete newErrors.license_number
                      return newErrors
                    })
                  }
                }}
                className={fieldErrors.license_number ? 'border-destructive' : ''}
                required
              />
              {fieldErrors.license_number && (
                <p className="text-sm text-destructive">{fieldErrors.license_number}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Combobox
                label="Vehicle Make"
                options={VEHICLE_MAKES}
                value={formData.vehicle_make ?? ''}
                onChange={(value) => {
                  updateFormData('vehicle_make', value)
                  if (fieldErrors.vehicle_make) {
                    setFieldErrors(prev => {
                      const newErrors = { ...prev }
                      delete newErrors.vehicle_make
                      return newErrors
                    })
                  }
                }}
                placeholder="Select or type to search vehicle make"
                error={fieldErrors.vehicle_make}
                required
              />
              <div className="space-y-2">
                <Label htmlFor="vehicle_model">Vehicle Model *</Label>
                <Input
                  id="vehicle_model"
                  value={formData.vehicle_model}
                  onChange={(e) => {
                    updateFormData('vehicle_model', e.target.value)
                    if (fieldErrors.vehicle_model) {
                      setFieldErrors(prev => {
                        const newErrors = { ...prev }
                        delete newErrors.vehicle_model
                        return newErrors
                      })
                    }
                  }}
                  className={fieldErrors.vehicle_model ? 'border-destructive' : ''}
                  required
                />
                {fieldErrors.vehicle_model && (
                  <p className="text-sm text-destructive">{fieldErrors.vehicle_model}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Combobox
                label="Vehicle Year"
                options={VEHICLE_YEARS}
                value={formData.vehicle_year?.toString() ?? ''}
                onChange={(value) => {
                  updateFormData('vehicle_year', value ? parseInt(value) : undefined)
                  if (fieldErrors.vehicle_year) {
                    setFieldErrors(prev => {
                      const newErrors = { ...prev }
                      delete newErrors.vehicle_year
                      return newErrors
                    })
                  }
                }}
                placeholder="Select or type to search vehicle year"
                error={fieldErrors.vehicle_year}
                required
              />
              <div className="space-y-2">
                <Label htmlFor="vehicle_color">Vehicle Color *</Label>
                <Input
                  id="vehicle_color"
                  value={formData.vehicle_color}
                  onChange={(e) => {
                    updateFormData('vehicle_color', e.target.value)
                    if (fieldErrors.vehicle_color) {
                      setFieldErrors(prev => {
                        const newErrors = { ...prev }
                        delete newErrors.vehicle_color
                        return newErrors
                      })
                    }
                  }}
                  className={fieldErrors.vehicle_color ? 'border-destructive' : ''}
                  required
                />
                {fieldErrors.vehicle_color && (
                  <p className="text-sm text-destructive">{fieldErrors.vehicle_color}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle_registration">Vehicle Registration Number *</Label>
              <Input
                id="vehicle_registration"
                value={formData.vehicle_registration}
                onChange={(e) => {
                  updateFormData('vehicle_registration', e.target.value)
                  if (fieldErrors.vehicle_registration) {
                    setFieldErrors(prev => {
                      const newErrors = { ...prev }
                      delete newErrors.vehicle_registration
                      return newErrors
                    })
                  }
                }}
                className={fieldErrors.vehicle_registration ? 'border-destructive' : ''}
                required
              />
              {fieldErrors.vehicle_registration && (
                <p className="text-sm text-destructive">{fieldErrors.vehicle_registration}</p>
              )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insurance_provider">Insurance Provider</Label>
                <Input
                  id="insurance_provider"
                  value={formData.insurance_provider}
                  onChange={(e) => updateFormData('insurance_provider', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insurance_policy_number">Insurance Policy Number</Label>
                <Input
                  id="insurance_policy_number"
                  value={formData.insurance_policy_number}
                  onChange={(e) => updateFormData('insurance_policy_number', e.target.value)}
                />
              </div>
            </div>
            <MultiSelect
              label="Service Areas"
              options={SERVICE_AREAS}
              value={formData.service_areas ?? []}
              onChange={(value) => updateFormData('service_areas', value)}
              placeholder="Select service areas"
            />
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Hourly Rate (USD)</Label>
              <Input
                id="hourly_rate"
                type="number"
                value={formData.hourly_rate ?? ''}
                onChange={(e) => updateFormData('hourly_rate', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="50"
              />
            </div>
            <MultiSelect
              label="Availability"
              options={AVAILABILITY_OPTIONS}
              value={availabilityDays}
              onChange={(value) => setAvailabilityDays(value)}
              placeholder="Select available days"
            />
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add a profile picture and gallery images of your vehicle. You can skip this step and add pictures later from your profile.
              </p>
              {userId && (
                <ImageUpload
                  currentImageUrl={profileImageUrl}
                  onUpload={async (url) => {
                    setProfileImageUrl(url)
                  }}
                  label="Profile Picture"
                  bucket="profile-pictures"
                  userId={userId}
                />
              )}
            </div>
            <div className="space-y-4">
              <label className="text-sm font-medium">Gallery Pictures ({galleryImages.length}/5)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {galleryImages.map((img, index) => (
                  <div key={index} className="relative">
                    <img
                      src={img.image_url}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => setGalleryImages(prev => prev.filter((_, i) => i !== index))}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {galleryImages.length < 5 && (
                  <label className="cursor-pointer">
                    <div className="w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center hover:border-muted-foreground/50 transition-colors">
                      <Plus className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files ?? [])
                        if (files.length === 0) return
                        if (galleryImages.length + files.length > 5) {
                          alert(`You can only upload up to 5 images. You currently have ${galleryImages.length} image(s).`)
                          return
                        }
                        if (!userId) {
                          alert('Please wait while we set up your account...')
                          return
                        }
                        for (const file of files) {
                          if (galleryImages.length >= 5) break
                          try {
                            const fileExt = file.name.split('.').pop()
                            const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
                            const filePath = `${userId}/${fileName}`
                            const { error: uploadError } = await supabase.storage
                              .from('gallery-pictures')
                              .upload(filePath, file, { cacheControl: '3600', upsert: false })
                            if (uploadError) throw uploadError
                            const { data: { publicUrl } } = supabase.storage
                              .from('gallery-pictures')
                              .getPublicUrl(filePath)
                            setGalleryImages(prev => [...prev, { image_url: publicUrl, display_order: prev.length }])
                          } catch (error: any) {
                            alert(error.message ?? 'Failed to upload image')
                          }
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Personal Information</h3>
              <p className="text-sm text-muted-foreground">
                {formData.first_name} {formData.last_name}
              </p>
              {formData.business_name && (
                <p className="text-sm text-muted-foreground">
                  Business: {formData.business_name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Contact Details</h3>
              <p className="text-sm text-muted-foreground">{formData.email}</p>
              <p className="text-sm text-muted-foreground">{formData.phone}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Vehicle Information</h3>
              <p className="text-sm text-muted-foreground">
                {formData.vehicle_year} {formData.vehicle_make} {formData.vehicle_model} ({formData.vehicle_color})
              </p>
              <p className="text-sm text-muted-foreground">
                License: {formData.license_number} | Registration: {formData.vehicle_registration}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Business Details</h3>
              <p className="text-sm text-muted-foreground">
                Service Areas: {formData.service_areas?.join(', ') ?? 'Not specified'}
              </p>
              <p className="text-sm text-muted-foreground">
                Hourly Rate: ${formData.hourly_rate ?? 'Not specified'}
              </p>
              <p className="text-sm text-muted-foreground">
                Availability: {availabilityDays.length > 0 ? availabilityDays.join(', ') : 'Not specified'}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Pictures</h3>
              <p className="text-sm text-muted-foreground">
                Profile Picture: {profileImageUrl ? 'Added' : 'Not added'}
              </p>
              <p className="text-sm text-muted-foreground">
                Gallery Pictures: {galleryImages.length} / 5
              </p>
            </div>
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        <Button variant="ghost" onClick={() => navigate('/prereg')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Taxi Owner Registration</CardTitle>
            <CardDescription>
              Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                {STEPS.map((_step, index) => (
                  <div key={index} className="flex items-center flex-1">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        index <= currentStep
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {index < currentStep ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-1 mx-2 ${
                          index < currentStep ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {renderStep()}

            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              {currentStep < STEPS.length - 1 ? (
                <Button type="button" onClick={nextStep}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Registration'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


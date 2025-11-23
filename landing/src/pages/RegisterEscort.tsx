import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MultiSelect } from '@/components/MultiSelect'
import { Combobox } from '@/components/Combobox'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import type { EscortProfile } from '@/lib/types'
import { validateEscortStep1, validateEscortStep2, type ValidationError } from '@/lib/validation'
import { LANGUAGES, ESCORT_SERVICES, AVAILABILITY_OPTIONS, SOUTH_AFRICAN_CITIES } from '@/lib/constants'
import { checkEmailUniqueness } from '@/lib/emailCheck'

const STEPS = [
  'Personal Information',
  'Contact Details',
  'Professional Details',
  'Review & Submit'
]

export default function RegisterEscort() {
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const navigate = useNavigate()

  const [formData, setFormData] = useState<Partial<EscortProfile>>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    location: '',
    languages: [],
    services: [],
    hourly_rate: undefined,
    availability: '',
    bio: '',
  })

  const [availabilityDays, setAvailabilityDays] = useState<string[]>([])

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const updateFormData = (field: keyof EscortProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = async () => {
    setFieldErrors({})
    let errors: ValidationError[] = []

    if (currentStep === 0) {
      errors = validateEscortStep1(formData)
    } else if (currentStep === 1) {
      errors = validateEscortStep2(formData, password, confirmPassword)
      
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

      // Wait a moment to ensure the user is fully committed to auth.users
      await new Promise(resolve => setTimeout(resolve, 500))

      // Always use the database function to avoid foreign key constraint issues
      // The function uses SECURITY DEFINER and can handle cases where the user
      // might not be immediately available in auth.users
      let functionError = null
      let retries = 0
      const maxRetries = 3

      while (retries < maxRetries) {
        const { error: error } = await supabase.rpc('create_escort_profile', {
          p_user_id: authData.user.id,
          p_first_name: formData.first_name,
          p_last_name: formData.last_name,
          p_email: formData.email,
          p_phone: formData.phone,
          p_date_of_birth: formData.date_of_birth,
          p_gender: formData.gender,
          p_location: formData.location,
          p_languages: formData.languages ?? [],
          p_services: formData.services ?? [],
          p_hourly_rate: formData.hourly_rate ?? null,
          p_availability: availabilityDays.length > 0 ? availabilityDays.join(', ') : null,
          p_bio: formData.bio ?? null,
        })

        functionError = error

        // If no error, break out of retry loop
        if (!functionError) break

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

      navigate('/profile/escort')
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
              <Label htmlFor="date_of_birth">Date of Birth *</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => {
                  updateFormData('date_of_birth', e.target.value)
                  if (fieldErrors.date_of_birth) {
                    setFieldErrors(prev => {
                      const newErrors = { ...prev }
                      delete newErrors.date_of_birth
                      return newErrors
                    })
                  }
                }}
                className={fieldErrors.date_of_birth ? 'border-destructive' : ''}
                required
              />
              {fieldErrors.date_of_birth && (
                <p className="text-sm text-destructive">{fieldErrors.date_of_birth}</p>
              )}
            </div>
            <Combobox
              label="Gender"
              options={['male', 'female', 'non-binary', 'other']}
              value={formData.gender}
              onChange={(value) => {
                updateFormData('gender', value)
                if (fieldErrors.gender) {
                  setFieldErrors(prev => {
                    const newErrors = { ...prev }
                    delete newErrors.gender
                    return newErrors
                  })
                }
              }}
              placeholder="Select or type to search gender"
              error={fieldErrors.gender}
              required
            />
          </div>
        )

      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
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
                className={fieldErrors.email ? 'border-destructive' : ''}
                required
              />
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
            <Combobox
              label="Location (City)"
              options={SOUTH_AFRICAN_CITIES}
              value={formData.location}
              onChange={(value) => {
                updateFormData('location', value)
                if (fieldErrors.location) {
                  setFieldErrors(prev => {
                    const newErrors = { ...prev }
                    delete newErrors.location
                    return newErrors
                  })
                }
              }}
              placeholder="Select or type to search your city"
              error={fieldErrors.location}
              required
            />
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
            <MultiSelect
              label="Languages *"
              options={LANGUAGES}
              value={formData.languages ?? []}
              onChange={(value) => updateFormData('languages', value)}
              placeholder="Select languages you speak"
            />
            <MultiSelect
              label="Services Offered *"
              options={ESCORT_SERVICES}
              value={formData.services ?? []}
              onChange={(value) => updateFormData('services', value)}
              placeholder="Select services you offer"
            />
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Hourly Rate (USD)</Label>
              <Input
                id="hourly_rate"
                type="number"
                value={formData.hourly_rate ?? ''}
                onChange={(e) => updateFormData('hourly_rate', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="100"
              />
            </div>
            <MultiSelect
              label="Availability"
              options={AVAILABILITY_OPTIONS}
              value={availabilityDays}
              onChange={(value) => setAvailabilityDays(value)}
              placeholder="Select available days"
            />
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => updateFormData('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Personal Information</h3>
              <p className="text-sm text-muted-foreground">
                {formData.first_name} {formData.last_name}
              </p>
              <p className="text-sm text-muted-foreground">
                DOB: {formData.date_of_birth} | Gender: {formData.gender}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Contact Details</h3>
              <p className="text-sm text-muted-foreground">{formData.email}</p>
              <p className="text-sm text-muted-foreground">{formData.phone}</p>
              <p className="text-sm text-muted-foreground">{formData.location}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Professional Details</h3>
              <p className="text-sm text-muted-foreground">
                Languages: {formData.languages?.join(', ') ?? 'Not specified'}
              </p>
              <p className="text-sm text-muted-foreground">
                Services: {formData.services?.join(', ') ?? 'Not specified'}
              </p>
              <p className="text-sm text-muted-foreground">
                Hourly Rate: ${formData.hourly_rate ?? 'Not specified'}
              </p>
              <p className="text-sm text-muted-foreground">
                Availability: {availabilityDays.length > 0 ? availabilityDays.join(', ') : 'Not specified'}
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
            <CardTitle>Escort Registration</CardTitle>
            <CardDescription>
              Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                {STEPS.map((step, index) => (
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


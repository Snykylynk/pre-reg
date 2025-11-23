export interface ValidationError {
  field: string
  message: string
}

export const validateEmail = (email: string): string | null => {
  if (!email) {
    return 'Email is required'
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address'
  }
  return null
}

export const validatePhone = (phone: string): string | null => {
  if (!phone) {
    return 'Phone number is required'
  }
  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '')
  if (digitsOnly.length < 10) {
    return 'Please enter a valid phone number (at least 10 digits)'
  }
  return null
}

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Password is required'
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters long'
  }
  return null
}

export const validateDateOfBirth = (dateOfBirth: string): string | null => {
  if (!dateOfBirth) {
    return 'Date of birth is required'
  }
  const date = new Date(dateOfBirth)
  const today = new Date()
  const age = today.getFullYear() - date.getFullYear()
  const monthDiff = today.getMonth() - date.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    return 'Invalid date of birth'
  }
  
  if (age < 18) {
    return 'You must be at least 18 years old'
  }
  
  if (age > 120) {
    return 'Please enter a valid date of birth'
  }
  
  return null
}

export const validateRequired = (value: string | undefined | null, fieldName: string): string | null => {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`
  }
  return null
}

export const validateVehicleYear = (year: number | undefined): string | null => {
  if (year === undefined || year === null) {
    return 'Vehicle year is required'
  }
  const currentYear = new Date().getFullYear()
  if (year < 1900 || year > currentYear + 1) {
    return `Vehicle year must be between 1900 and ${currentYear + 1}`
  }
  return null
}

export const validateEscortStep1 = (formData: {
  first_name?: string
  last_name?: string
  date_of_birth?: string
  gender?: string
}): ValidationError[] => {
  const errors: ValidationError[] = []
  
  const firstNameError = validateRequired(formData.first_name, 'First name')
  if (firstNameError) errors.push({ field: 'first_name', message: firstNameError })
  
  const lastNameError = validateRequired(formData.last_name, 'Last name')
  if (lastNameError) errors.push({ field: 'last_name', message: lastNameError })
  
  const dobError = validateDateOfBirth(formData.date_of_birth ?? '')
  if (dobError) errors.push({ field: 'date_of_birth', message: dobError })
  
  const genderError = validateRequired(formData.gender, 'Gender')
  if (genderError) errors.push({ field: 'gender', message: genderError })
  
  return errors
}

export const validateEscortStep2 = (formData: {
  email?: string
  phone?: string
  location?: string
}, password: string, confirmPassword: string): ValidationError[] => {
  const errors: ValidationError[] = []
  
  const emailError = validateEmail(formData.email ?? '')
  if (emailError) errors.push({ field: 'email', message: emailError })
  
  const phoneError = validatePhone(formData.phone ?? '')
  if (phoneError) errors.push({ field: 'phone', message: phoneError })
  
  const locationError = validateRequired(formData.location, 'Location')
  if (locationError) errors.push({ field: 'location', message: locationError })
  
  const passwordError = validatePassword(password)
  if (passwordError) errors.push({ field: 'password', message: passwordError })
  
  if (password !== confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Passwords do not match' })
  }
  
  return errors
}

export const validateTaxiStep1 = (formData: {
  first_name?: string
  last_name?: string
}): ValidationError[] => {
  const errors: ValidationError[] = []
  
  const firstNameError = validateRequired(formData.first_name, 'First name')
  if (firstNameError) errors.push({ field: 'first_name', message: firstNameError })
  
  const lastNameError = validateRequired(formData.last_name, 'Last name')
  if (lastNameError) errors.push({ field: 'last_name', message: lastNameError })
  
  return errors
}

export const validateTaxiStep2 = (formData: {
  email?: string
  phone?: string
}, password: string, confirmPassword: string): ValidationError[] => {
  const errors: ValidationError[] = []
  
  const emailError = validateEmail(formData.email ?? '')
  if (emailError) errors.push({ field: 'email', message: emailError })
  
  const phoneError = validatePhone(formData.phone ?? '')
  if (phoneError) errors.push({ field: 'phone', message: phoneError })
  
  const passwordError = validatePassword(password)
  if (passwordError) errors.push({ field: 'password', message: passwordError })
  
  if (password !== confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Passwords do not match' })
  }
  
  return errors
}

export const validateTaxiStep3 = (formData: {
  license_number?: string
  vehicle_make?: string
  vehicle_model?: string
  vehicle_year?: number
  vehicle_color?: string
  vehicle_registration?: string
}): ValidationError[] => {
  const errors: ValidationError[] = []
  
  const licenseError = validateRequired(formData.license_number, 'Driver\'s license number')
  if (licenseError) errors.push({ field: 'license_number', message: licenseError })
  
  const makeError = validateRequired(formData.vehicle_make, 'Vehicle make')
  if (makeError) errors.push({ field: 'vehicle_make', message: makeError })
  
  const modelError = validateRequired(formData.vehicle_model, 'Vehicle model')
  if (modelError) errors.push({ field: 'vehicle_model', message: modelError })
  
  const yearError = validateVehicleYear(formData.vehicle_year)
  if (yearError) errors.push({ field: 'vehicle_year', message: yearError })
  
  const colorError = validateRequired(formData.vehicle_color, 'Vehicle color')
  if (colorError) errors.push({ field: 'vehicle_color', message: colorError })
  
  const registrationError = validateRequired(formData.vehicle_registration, 'Vehicle registration number')
  if (registrationError) errors.push({ field: 'vehicle_registration', message: registrationError })
  
  return errors
}


export interface EscortProfile {
  id?: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth: string
  gender: string
  location: string
  languages?: string[]
  services?: string[]
  hourly_rate?: number
  availability?: string
  bio?: string
  profile_image_url?: string
  verified?: boolean
  created_at?: string
  updated_at?: string
}

export interface TaxiOwnerProfile {
  id?: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  business_name?: string
  license_number: string
  vehicle_make?: string
  vehicle_model?: string
  vehicle_year?: number
  vehicle_color?: string
  vehicle_registration?: string
  insurance_provider?: string
  insurance_policy_number?: string
  service_areas?: string[]
  hourly_rate?: number
  availability?: string
  profile_image_url?: string
  verified?: boolean
  created_at?: string
  updated_at?: string
}

export interface ProfilePicture {
  id: string
  profile_id: string
  profile_type: 'escort' | 'taxi'
  image_url: string
  display_order: number
  created_at?: string
  updated_at?: string
}

export interface DashboardStats {
  totalEscorts: number
  totalTaxis: number
  verifiedEscorts: number
  verifiedTaxis: number
  recentEscorts: number
  recentTaxis: number
}

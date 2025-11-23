import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { TaxiOwnerProfile, ProfilePicture } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { CheckCircle, XCircle, Search, Car } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ImageCarousel } from '@/components/ImageCarousel'

const loadGalleryImages = async (profileId: string, profileType: 'escort' | 'taxi') => {
  try {
    // First, check if we're admin
    const { data: { user } } = await supabase.auth.getUser()
    console.log('Current user:', user?.id, 'Admin?', user?.app_metadata?.is_admin)
    
    // Try using the admin function first (bypasses RLS)
    const { data: functionData, error: functionError } = await supabase.rpc('get_profile_pictures_admin', {
      p_profile_id: profileId,
      p_profile_type: profileType,
    })

    if (functionError) {
      console.warn('Admin function error (will try direct query):', functionError)
      console.warn('Function error code:', functionError.code)
      console.warn('Function error message:', functionError.message)
    } else if (functionData) {
      console.log(`✅ Loaded ${functionData.length} gallery images via admin function`)
      if (functionData.length > 0) {
        console.log('Gallery image URLs:', functionData.map((img: any) => img.image_url))
      }
      return functionData
    }

    // Fallback to direct query
    console.log('⚠️ Admin function not available or returned no data, trying direct query...')
    const { data, error } = await supabase
      .from('profile_pictures')
      .select('*')
      .eq('profile_id', profileId)
      .eq('profile_type', profileType)
      .order('display_order', { ascending: true })
    
    if (error) {
      console.error('Error loading gallery images:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)
      console.error('Error hint:', error.hint)
      return []
    }
    
    console.log(`Loaded ${data?.length ?? 0} gallery images for ${profileType} profile ${profileId}`)
    if (data && data.length > 0) {
      console.log('Gallery image URLs:', data.map(img => img.image_url))
    }
    return data ?? []
  } catch (err) {
    console.error('Exception loading gallery:', err)
    return []
  }
}

export function TaxisPage() {
  const [taxis, setTaxis] = useState<TaxiOwnerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all')
  const [selectedTaxi, setSelectedTaxi] = useState<TaxiOwnerProfile | null>(null)
  const [galleryImages, setGalleryImages] = useState<ProfilePicture[]>([])

  useEffect(() => {
    fetchTaxis()
  }, [])

  // Load gallery images when taxi is selected
  useEffect(() => {
    if (selectedTaxi?.id) {
      loadGalleryImages(selectedTaxi.id, 'taxi').then(setGalleryImages)
    } else {
      setGalleryImages([])
    }
  }, [selectedTaxi?.id])

  const fetchTaxis = async () => {
    try {
      const { data, error } = await supabase
        .from('taxi_owner_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTaxis(data ?? [])
    } catch (error) {
      console.error('Error fetching taxis:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleVerification = async (e: React.MouseEvent, profileId: string, currentStatus: boolean) => {
    e.stopPropagation()
    try {
      const { error } = await supabase
        .from('taxi_owner_profiles')
        .update({ verified: !currentStatus })
        .eq('id', profileId)

      if (error) throw error
      await fetchTaxis()
      if (selectedTaxi?.id === profileId) {
        setSelectedTaxi({ ...selectedTaxi, verified: !currentStatus })
      }
    } catch (error) {
      console.error('Error updating verification:', error)
      alert('Failed to update verification status')
    }
  }

  const filteredTaxis = taxis.filter((taxi) => {
    const matchesSearch =
      taxi.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      taxi.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      taxi.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      taxi.phone.includes(searchTerm) ||
      (taxi.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

    const matchesFilter =
      filterVerified === 'all' ||
      (filterVerified === 'verified' && taxi.verified) ||
      (filterVerified === 'unverified' && !taxi.verified)

    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading taxis...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or business..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>
        <select
          value={filterVerified}
          onChange={(e) => setFilterVerified(e.target.value as 'all' | 'verified' | 'unverified')}
          className="px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          title="Filter by verification status"
          aria-label="Filter by verification status"
        >
          <option value="all">All Taxis</option>
          <option value="verified">Verified Only</option>
          <option value="unverified">Unverified Only</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {filteredTaxis.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No taxi drivers found</p>
              <p className="text-sm mt-1">Try adjusting your search or filter criteria</p>
            </CardContent>
          </Card>
        ) : (
          <div className="divide-y divide-border">
            {filteredTaxis.map((taxi) => (
              <div
                key={taxi.id}
                onClick={() => {
                  setSelectedTaxi(taxi)
                }}
                className="p-4 hover:bg-accent/50 cursor-pointer transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0 items-center">
                  {taxi.profile_image_url ? (
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={taxi.profile_image_url}
                        alt={`${taxi.first_name} ${taxi.last_name}`}
                        className="w-12 h-12 rounded-full object-cover border border-border flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{taxi.first_name} {taxi.last_name}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="min-w-0">
                      <p className="font-medium truncate">{taxi.first_name} {taxi.last_name}</p>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground truncate">{taxi.email}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm truncate">{taxi.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {taxi.verified ? (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-green-600 bg-green-600/10 px-2.5 py-1 rounded-full">
                      <CheckCircle className="h-4 w-4" />
                      Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                      <XCircle className="h-4 w-4" />
                      Unverified
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => toggleVerification(e, taxi.id!, taxi.verified ?? false)}
                    className="whitespace-nowrap"
                  >
                    {taxi.verified ? 'Unverify' : 'Verify'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTaxi && (
        <Modal
          isOpen={!!selectedTaxi}
          onClose={() => {
            setSelectedTaxi(null)
            setGalleryImages([])
          }}
          title=""
        >
          <div className="space-y-0">
            {/* Profile Header - Social Media Style */}
            <div className="relative">
              {/* Cover/Header Area */}
              <div className="relative h-48 bg-gradient-to-r from-primary/20 to-primary/5 rounded-t-lg overflow-hidden">
                {selectedTaxi.profile_image_url ? (
                  <img
                    src={selectedTaxi.profile_image_url}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10" />
                )}
              </div>
              
              {/* Profile Picture Avatar */}
              <div className="absolute -bottom-16 left-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-background bg-background shadow-lg overflow-hidden">
                    {selectedTaxi.profile_image_url ? (
                      <img
                        src={selectedTaxi.profile_image_url}
                        alt={`${selectedTaxi.first_name} ${selectedTaxi.last_name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Car className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  {selectedTaxi.verified && (
                    <div className="absolute -bottom-1 -right-1 bg-green-600 rounded-full p-1.5 border-4 border-background">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Info Section */}
            <div className="pt-20 px-6 pb-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-left">
                    {selectedTaxi.first_name} {selectedTaxi.last_name}
                  </h2>
                  {selectedTaxi.business_name && (
                    <p className="text-muted-foreground mt-1 text-left">{selectedTaxi.business_name}</p>
                  )}
                  {selectedTaxi.vehicle_make && selectedTaxi.vehicle_model && (
                    <p className="text-sm text-muted-foreground mt-1 text-left">
                      {selectedTaxi.vehicle_year} {selectedTaxi.vehicle_make} {selectedTaxi.vehicle_model}
                    </p>
                  )}
                </div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleVerification(e, selectedTaxi.id!, selectedTaxi.verified ?? false)
                  }}
                  variant={selectedTaxi.verified ? "outline" : "default"}
                  className="whitespace-nowrap"
                >
                  {selectedTaxi.verified ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verified
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Verify
                    </>
                  )}
                </Button>
              </div>

              {/* Gallery Images Carousel */}
              <ImageCarousel images={galleryImages} title="Vehicle Gallery" />

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-left">
              <div>
                <p className="text-sm text-muted-foreground mb-1">First Name</p>
                <p className="font-medium">{selectedTaxi.first_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Last Name</p>
                <p className="font-medium">{selectedTaxi.last_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="font-medium">{selectedTaxi.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Phone</p>
                <p className="font-medium">{selectedTaxi.phone}</p>
              </div>
              {selectedTaxi.business_name && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Business Name</p>
                  <p className="font-medium">{selectedTaxi.business_name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-1">License Number</p>
                <p className="font-medium">{selectedTaxi.license_number}</p>
              </div>
              {selectedTaxi.vehicle_make && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Vehicle Make</p>
                  <p className="font-medium">{selectedTaxi.vehicle_make}</p>
                </div>
              )}
              {selectedTaxi.vehicle_model && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Vehicle Model</p>
                  <p className="font-medium">{selectedTaxi.vehicle_model}</p>
                </div>
              )}
              {selectedTaxi.vehicle_year && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Vehicle Year</p>
                  <p className="font-medium">{selectedTaxi.vehicle_year}</p>
                </div>
              )}
              {selectedTaxi.vehicle_color && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Vehicle Color</p>
                  <p className="font-medium">{selectedTaxi.vehicle_color}</p>
                </div>
              )}
              {selectedTaxi.vehicle_registration && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Vehicle Registration</p>
                  <p className="font-medium">{selectedTaxi.vehicle_registration}</p>
                </div>
              )}
              {selectedTaxi.insurance_provider && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Insurance Provider</p>
                  <p className="font-medium">{selectedTaxi.insurance_provider}</p>
                </div>
              )}
              {selectedTaxi.insurance_policy_number && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Insurance Policy Number</p>
                  <p className="font-medium">{selectedTaxi.insurance_policy_number}</p>
                </div>
              )}
              {selectedTaxi.hourly_rate && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Hourly Rate</p>
                  <p className="font-medium">${selectedTaxi.hourly_rate}</p>
                </div>
              )}
              {selectedTaxi.availability && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Availability</p>
                  <p className="font-medium">{selectedTaxi.availability}</p>
                </div>
              )}
              {selectedTaxi.created_at && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Registered</p>
                  <p className="font-medium">
                    {new Date(selectedTaxi.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Verification Status</p>
                <p className="font-medium">
                  {selectedTaxi.verified ? (
                    <span className="text-green-600">Verified</span>
                  ) : (
                    <span className="text-muted-foreground">Unverified</span>
                  )}
                </p>
              </div>
              </div>

              {/* Service Areas */}
              {selectedTaxi.service_areas && selectedTaxi.service_areas.length > 0 && (
                <div className="text-left">
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Service Areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTaxi.service_areas.map((area, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

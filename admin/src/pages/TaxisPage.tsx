import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { TaxiOwnerProfile, ProfilePicture } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { CheckCircle, XCircle, Search, Car, Ban, Edit, Trash2, ShieldX } from 'lucide-react'
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingTaxi, setEditingTaxi] = useState<TaxiOwnerProfile | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<TaxiOwnerProfile>>({})

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

  const toggleBan = async (e: React.MouseEvent, profileId: string, userId: string, currentStatus: boolean) => {
    e.stopPropagation()
    if (!confirm(`Are you sure you want to ${currentStatus ? 'unban' : 'ban'} this user?`)) {
      return
    }

    try {
      const newBannedStatus = !currentStatus
      
      // Update profile banned status
      const { error: profileError } = await supabase
        .from('taxi_owner_profiles')
        .update({ banned: newBannedStatus })
        .eq('id', profileId)

      if (profileError) throw profileError

      // Use Supabase Auth's built-in ban functionality
      if (newBannedStatus) {
        // Ban user: set ban_duration to a very long period (effectively permanent)
        const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
          ban_duration: '9999d' // 9999 days (effectively permanent)
        })

        if (authError) {
          console.error('Could not ban user via auth:', authError)
          throw authError
        }
      } else {
        // Unban user: set ban_duration to 'none'
        const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
          ban_duration: 'none'
        })

        if (authError) {
          console.error('Could not unban user via auth:', authError)
          throw authError
        }
      }

      await fetchTaxis()
      if (selectedTaxi?.id === profileId) {
        setSelectedTaxi({ ...selectedTaxi, banned: newBannedStatus })
      }
    } catch (error) {
      console.error('Error updating ban status:', error)
      alert('Failed to update ban status')
    }
  }

  const handleEdit = (e: React.MouseEvent, taxi: TaxiOwnerProfile) => {
    e.stopPropagation()
    setEditingTaxi(taxi)
    setEditFormData({
      first_name: taxi.first_name,
      last_name: taxi.last_name,
      email: taxi.email,
      phone: taxi.phone,
      business_name: taxi.business_name,
      license_number: taxi.license_number,
      vehicle_make: taxi.vehicle_make,
      vehicle_model: taxi.vehicle_model,
      vehicle_year: taxi.vehicle_year,
      vehicle_color: taxi.vehicle_color,
      vehicle_registration: taxi.vehicle_registration,
      insurance_provider: taxi.insurance_provider,
      insurance_policy_number: taxi.insurance_policy_number,
      service_areas: taxi.service_areas,
      hourly_rate: taxi.hourly_rate,
      availability: taxi.availability,
      profile_image_url: taxi.profile_image_url,
    })
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingTaxi?.id) return

    try {
      const { error } = await supabase
        .from('taxi_owner_profiles')
        .update({
          ...editFormData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingTaxi.id)

      if (error) throw error

      await fetchTaxis()
      if (selectedTaxi?.id === editingTaxi.id) {
        setSelectedTaxi({ ...selectedTaxi, ...editFormData })
      }
      setIsEditModalOpen(false)
      setEditingTaxi(null)
      setEditFormData({})
    } catch (error) {
      console.error('Error updating taxi:', error)
      alert('Failed to update taxi profile')
    }
  }

  const handleDelete = async (e: React.MouseEvent, profileId: string, userId: string) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      return
    }

    try {
      // Delete the profile (this will cascade delete related data due to ON DELETE CASCADE)
      const { error: profileError } = await supabase
        .from('taxi_owner_profiles')
        .delete()
        .eq('id', profileId)

      if (profileError) throw profileError

      // Optionally delete the auth user as well
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      if (authError) {
        console.warn('Could not delete auth user:', authError)
        // Continue anyway as profile deletion succeeded
      }

      await fetchTaxis()
      if (selectedTaxi?.id === profileId) {
        setSelectedTaxi(null)
      }
    } catch (error) {
      console.error('Error deleting taxi:', error)
      alert('Failed to delete taxi profile')
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
        <div className="text-white">Loading taxis...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white" />
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
            <CardContent className="py-12 text-center text-white">
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
                        className="w-12 h-12 rounded-full object-cover border border-border shrink-0"
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
                    <p className="text-sm text-white truncate">{taxi.email}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm truncate">{taxi.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {taxi.verified ? (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-green-600 bg-green-600/10 px-2.5 py-1 rounded-full">
                      <CheckCircle className="h-4 w-4" />
                      Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-white bg-muted px-2.5 py-1 rounded-full">
                      <XCircle className="h-4 w-4" />
                      Unverified
                    </span>
                  )}
                  {taxi.banned && (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-red-600 bg-red-600/10 px-2.5 py-1 rounded-full">
                      <Ban className="h-4 w-4" />
                      Banned
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => toggleBan(e, taxi.id!, taxi.user_id, taxi.banned ?? false)}
                    className="whitespace-nowrap"
                    title={taxi.banned ? 'Unban user' : 'Ban user'}
                  >
                    {taxi.banned ? <ShieldX className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleEdit(e, taxi)}
                    className="whitespace-nowrap"
                    title="Edit profile"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleDelete(e, taxi.id!, taxi.user_id)}
                    className="whitespace-nowrap text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Delete profile"
                  >
                    <Trash2 className="h-4 w-4" />
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
                        <Car className="w-12 h-12 text-white" />
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
                    <p className="text-white mt-1 text-left">{selectedTaxi.business_name}</p>
                  )}
                  {selectedTaxi.vehicle_make && selectedTaxi.vehicle_model && (
                    <p className="text-sm text-white mt-1 text-left">
                      {selectedTaxi.vehicle_year} {selectedTaxi.vehicle_make} {selectedTaxi.vehicle_model}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
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
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleBan(e, selectedTaxi.id!, selectedTaxi.user_id, selectedTaxi.banned ?? false)
                    }}
                    variant={selectedTaxi.banned ? "default" : "outline"}
                    className="whitespace-nowrap"
                    title={selectedTaxi.banned ? 'Unban user' : 'Ban user'}
                  >
                    {selectedTaxi.banned ? (
                      <>
                        <ShieldX className="w-4 h-4 mr-2" />
                        Unban
                      </>
                    ) : (
                      <>
                        <Ban className="w-4 h-4 mr-2" />
                        Ban
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit(e, selectedTaxi)
                    }}
                    variant="outline"
                    className="whitespace-nowrap"
                    title="Edit profile"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(e, selectedTaxi.id!, selectedTaxi.user_id)
                    }}
                    variant="outline"
                    className="whitespace-nowrap text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Delete profile"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>

              {/* Gallery Images Carousel */}
              <ImageCarousel images={galleryImages} title="Vehicle Gallery" />

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-left">
              <div>
                <p className="text-sm text-white mb-1">First Name</p>
                <p className="font-medium">{selectedTaxi.first_name}</p>
              </div>
              <div>
                <p className="text-sm text-white mb-1">Last Name</p>
                <p className="font-medium">{selectedTaxi.last_name}</p>
              </div>
              <div>
                <p className="text-sm text-white mb-1">Email</p>
                <p className="font-medium">{selectedTaxi.email}</p>
              </div>
              <div>
                <p className="text-sm text-white mb-1">Phone</p>
                <p className="font-medium">{selectedTaxi.phone}</p>
              </div>
              {selectedTaxi.business_name && (
                <div>
                  <p className="text-sm text-white mb-1">Business Name</p>
                  <p className="font-medium">{selectedTaxi.business_name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-white mb-1">License Number</p>
                <p className="font-medium">{selectedTaxi.license_number}</p>
              </div>
              {selectedTaxi.vehicle_make && (
                <div>
                  <p className="text-sm text-white mb-1">Vehicle Make</p>
                  <p className="font-medium">{selectedTaxi.vehicle_make}</p>
                </div>
              )}
              {selectedTaxi.vehicle_model && (
                <div>
                  <p className="text-sm text-white mb-1">Vehicle Model</p>
                  <p className="font-medium">{selectedTaxi.vehicle_model}</p>
                </div>
              )}
              {selectedTaxi.vehicle_year && (
                <div>
                  <p className="text-sm text-white mb-1">Vehicle Year</p>
                  <p className="font-medium">{selectedTaxi.vehicle_year}</p>
                </div>
              )}
              {selectedTaxi.vehicle_color && (
                <div>
                  <p className="text-sm text-white mb-1">Vehicle Color</p>
                  <p className="font-medium">{selectedTaxi.vehicle_color}</p>
                </div>
              )}
              {selectedTaxi.vehicle_registration && (
                <div>
                  <p className="text-sm text-white mb-1">Vehicle Registration</p>
                  <p className="font-medium">{selectedTaxi.vehicle_registration}</p>
                </div>
              )}
              {selectedTaxi.insurance_provider && (
                <div>
                  <p className="text-sm text-white mb-1">Insurance Provider</p>
                  <p className="font-medium">{selectedTaxi.insurance_provider}</p>
                </div>
              )}
              {selectedTaxi.insurance_policy_number && (
                <div>
                  <p className="text-sm text-white mb-1">Insurance Policy Number</p>
                  <p className="font-medium">{selectedTaxi.insurance_policy_number}</p>
                </div>
              )}
              {selectedTaxi.hourly_rate && (
                <div>
                  <p className="text-sm text-white mb-1">Hourly Rate</p>
                  <p className="font-medium">${selectedTaxi.hourly_rate}</p>
                </div>
              )}
              {selectedTaxi.availability && (
                <div>
                  <p className="text-sm text-white mb-1">Availability</p>
                  <p className="font-medium">{selectedTaxi.availability}</p>
                </div>
              )}
              {selectedTaxi.created_at && (
                <div>
                  <p className="text-sm text-white mb-1">Registered</p>
                  <p className="font-medium">
                    {new Date(selectedTaxi.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-white mb-1">Verification Status</p>
                <p className="font-medium">
                  {selectedTaxi.verified ? (
                    <span className="text-green-600">Verified</span>
                  ) : (
                    <span className="text-white">Unverified</span>
                  )}
                </p>
              </div>
              </div>

              {/* Service Areas */}
              {selectedTaxi.service_areas && selectedTaxi.service_areas.length > 0 && (
                <div className="text-left">
                  <h3 className="text-sm font-semibold mb-2 text-white">Service Areas</h3>
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

      {/* Edit Modal */}
      {isEditModalOpen && editingTaxi && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingTaxi(null)
            setEditFormData({})
          }}
          title="Edit Taxi Profile"
        >
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input
                  type="text"
                  value={editFormData.first_name ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  value={editFormData.last_name ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={editFormData.email ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={editFormData.phone ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Business Name</label>
                <input
                  type="text"
                  value={editFormData.business_name ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, business_name: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">License Number</label>
                <input
                  type="text"
                  value={editFormData.license_number ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, license_number: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vehicle Make</label>
                <input
                  type="text"
                  value={editFormData.vehicle_make ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, vehicle_make: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vehicle Model</label>
                <input
                  type="text"
                  value={editFormData.vehicle_model ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, vehicle_model: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vehicle Year</label>
                <input
                  type="number"
                  value={editFormData.vehicle_year ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, vehicle_year: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vehicle Color</label>
                <input
                  type="text"
                  value={editFormData.vehicle_color ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, vehicle_color: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vehicle Registration</label>
                <input
                  type="text"
                  value={editFormData.vehicle_registration ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, vehicle_registration: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Insurance Provider</label>
                <input
                  type="text"
                  value={editFormData.insurance_provider ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, insurance_provider: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Insurance Policy Number</label>
                <input
                  type="text"
                  value={editFormData.insurance_policy_number ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, insurance_policy_number: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hourly Rate</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.hourly_rate ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, hourly_rate: parseFloat(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Service Areas (comma-separated)</label>
                <input
                  type="text"
                  value={editFormData.service_areas?.join(', ') ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, service_areas: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                  placeholder="Area 1, Area 2"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Availability</label>
                <input
                  type="text"
                  value={editFormData.availability ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, availability: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Profile Image URL</label>
                <input
                  type="url"
                  value={editFormData.profile_image_url ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, profile_image_url: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false)
                  setEditingTaxi(null)
                  setEditFormData({})
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

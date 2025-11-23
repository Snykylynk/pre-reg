import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { EscortProfile, ProfilePicture } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { CheckCircle, XCircle, Search, Users, Ban, Edit, Trash2, ShieldX } from 'lucide-react'
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

export function EscortsPage() {
  const [escorts, setEscorts] = useState<EscortProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all')
  const [selectedEscort, setSelectedEscort] = useState<EscortProfile | null>(null)
  const [galleryImages, setGalleryImages] = useState<ProfilePicture[]>([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingEscort, setEditingEscort] = useState<EscortProfile | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<EscortProfile>>({})

  useEffect(() => {
    fetchEscorts()
  }, [])

  // Load gallery images when escort is selected
  useEffect(() => {
    if (selectedEscort?.id) {
      loadGalleryImages(selectedEscort.id, 'escort').then(setGalleryImages)
    } else {
      setGalleryImages([])
    }
  }, [selectedEscort?.id])

  const fetchEscorts = async () => {
    try {
      const { data, error } = await supabase
        .from('escort_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEscorts(data ?? [])
    } catch (error) {
      console.error('Error fetching escorts:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleVerification = async (e: React.MouseEvent, profileId: string, currentStatus: boolean) => {
    e.stopPropagation()
    try {
      const { error } = await supabase
        .from('escort_profiles')
        .update({ verified: !currentStatus })
        .eq('id', profileId)

      if (error) throw error
      await fetchEscorts()
      if (selectedEscort?.id === profileId) {
        setSelectedEscort({ ...selectedEscort, verified: !currentStatus })
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
        .from('escort_profiles')
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

      await fetchEscorts()
      if (selectedEscort?.id === profileId) {
        setSelectedEscort({ ...selectedEscort, banned: newBannedStatus })
      }
    } catch (error) {
      console.error('Error updating ban status:', error)
      alert('Failed to update ban status')
    }
  }

  const handleEdit = (e: React.MouseEvent, escort: EscortProfile) => {
    e.stopPropagation()
    setEditingEscort(escort)
    setEditFormData({
      first_name: escort.first_name,
      last_name: escort.last_name,
      email: escort.email,
      phone: escort.phone,
      location: escort.location,
      gender: escort.gender,
      date_of_birth: escort.date_of_birth,
      languages: escort.languages,
      services: escort.services,
      hourly_rate: escort.hourly_rate,
      availability: escort.availability,
      bio: escort.bio,
      profile_image_url: escort.profile_image_url,
    })
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingEscort?.id) return

    try {
      const { error } = await supabase
        .from('escort_profiles')
        .update({
          ...editFormData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingEscort.id)

      if (error) throw error

      await fetchEscorts()
      if (selectedEscort?.id === editingEscort.id) {
        setSelectedEscort({ ...selectedEscort, ...editFormData })
      }
      setIsEditModalOpen(false)
      setEditingEscort(null)
      setEditFormData({})
    } catch (error) {
      console.error('Error updating escort:', error)
      alert('Failed to update escort profile')
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
        .from('escort_profiles')
        .delete()
        .eq('id', profileId)

      if (profileError) throw profileError

      // Optionally delete the auth user as well
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      if (authError) {
        console.warn('Could not delete auth user:', authError)
        // Continue anyway as profile deletion succeeded
      }

      await fetchEscorts()
      if (selectedEscort?.id === profileId) {
        setSelectedEscort(null)
      }
    } catch (error) {
      console.error('Error deleting escort:', error)
      alert('Failed to delete escort profile')
    }
  }

  const filteredEscorts = escorts.filter((escort) => {
    const matchesSearch =
      escort.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      escort.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      escort.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      escort.phone.includes(searchTerm) ||
      escort.location.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter =
      filterVerified === 'all' ||
      (filterVerified === 'verified' && escort.verified) ||
      (filterVerified === 'unverified' && !escort.verified)

    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading escorts...</div>
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
            placeholder="Search by name, email, phone, or location..."
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
        >
          <option value="all">All Escorts</option>
          <option value="verified">Verified Only</option>
          <option value="unverified">Unverified Only</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {filteredEscorts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-white">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No escorts found</p>
              <p className="text-sm mt-1">Try adjusting your search or filter criteria</p>
            </CardContent>
          </Card>
        ) : (
          <div className="divide-y divide-border">
            {filteredEscorts.map((escort) => (
              <div
                key={escort.id}
                onClick={() => {
                  setSelectedEscort(escort)
                }}
                className="p-4 hover:bg-accent/50 cursor-pointer transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0 items-center">
                  {escort.profile_image_url ? (
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={escort.profile_image_url}
                        alt={`${escort.first_name} ${escort.last_name}`}
                        className="w-12 h-12 rounded-full object-cover border border-border flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{escort.first_name} {escort.last_name}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="min-w-0">
                      <p className="font-medium truncate">{escort.first_name} {escort.last_name}</p>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{escort.email}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm truncate">{escort.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {escort.verified ? (
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
                  {escort.banned && (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-red-600 bg-red-600/10 px-2.5 py-1 rounded-full">
                      <Ban className="h-4 w-4" />
                      Banned
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => toggleVerification(e, escort.id!, escort.verified ?? false)}
                    className="whitespace-nowrap"
                  >
                    {escort.verified ? 'Unverify' : 'Verify'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => toggleBan(e, escort.id!, escort.user_id, escort.banned ?? false)}
                    className="whitespace-nowrap"
                    title={escort.banned ? 'Unban user' : 'Ban user'}
                  >
                    {escort.banned ? <ShieldX className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleEdit(e, escort)}
                    className="whitespace-nowrap"
                    title="Edit profile"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleDelete(e, escort.id!, escort.user_id)}
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

      {selectedEscort && (
        <Modal
          isOpen={!!selectedEscort}
          onClose={() => {
            setSelectedEscort(null)
            setGalleryImages([])
          }}
          title=""
        >
          <div className="space-y-0">
            {/* Profile Header - Social Media Style */}
            <div className="relative">
              {/* Cover/Header Area */}
              <div className="relative h-48 bg-gradient-to-r from-primary/20 to-primary/5 rounded-t-lg overflow-hidden">
                {selectedEscort.profile_image_url ? (
                  <img
                    src={selectedEscort.profile_image_url}
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
                    {selectedEscort.profile_image_url ? (
                      <img
                        src={selectedEscort.profile_image_url}
                        alt={`${selectedEscort.first_name} ${selectedEscort.last_name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Users className="w-12 h-12 text-white" />
                      </div>
                    )}
                  </div>
                  {selectedEscort.verified && (
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
                    {selectedEscort.first_name} {selectedEscort.last_name}
                  </h2>
                  <p className="text-white mt-1 text-left">{selectedEscort.location}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleVerification(e, selectedEscort.id!, selectedEscort.verified ?? false)
                    }}
                    variant={selectedEscort.verified ? "outline" : "default"}
                    className="whitespace-nowrap"
                  >
                    {selectedEscort.verified ? (
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
                      toggleBan(e, selectedEscort.id!, selectedEscort.user_id, selectedEscort.banned ?? false)
                    }}
                    variant={selectedEscort.banned ? "default" : "outline"}
                    className="whitespace-nowrap"
                    title={selectedEscort.banned ? 'Unban user' : 'Ban user'}
                  >
                    {selectedEscort.banned ? (
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
                      handleEdit(e, selectedEscort)
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
                      handleDelete(e, selectedEscort.id!, selectedEscort.user_id)
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
              <ImageCarousel images={galleryImages} title="Gallery" />

              {/* Bio */}
              {selectedEscort.bio && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2 text-left">About</h3>
                  <p className="text-sm leading-relaxed text-white text-left">{selectedEscort.bio}</p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-left">
              <div>
                <p className="text-sm text-white mb-1">First Name</p>
                <p className="font-medium">{selectedEscort.first_name}</p>
              </div>
              <div>
                <p className="text-sm text-white mb-1">Last Name</p>
                <p className="font-medium">{selectedEscort.last_name}</p>
              </div>
              <div>
                <p className="text-sm text-white mb-1">Email</p>
                <p className="font-medium">{selectedEscort.email}</p>
              </div>
              <div>
                <p className="text-sm text-white mb-1">Phone</p>
                <p className="font-medium">{selectedEscort.phone}</p>
              </div>
              <div>
                <p className="text-sm text-white mb-1">Location</p>
                <p className="font-medium">{selectedEscort.location}</p>
              </div>
              <div>
                <p className="text-sm text-white mb-1">Gender</p>
                <p className="font-medium">{selectedEscort.gender}</p>
              </div>
              {selectedEscort.date_of_birth && (
                <div>
                  <p className="text-sm text-white mb-1">Date of Birth</p>
                  <p className="font-medium">
                    {new Date(selectedEscort.date_of_birth).toLocaleDateString()}
                  </p>
                </div>
              )}
              {selectedEscort.hourly_rate && (
                <div>
                  <p className="text-sm text-white mb-1">Hourly Rate</p>
                  <p className="font-medium">${selectedEscort.hourly_rate}</p>
                </div>
              )}
              {selectedEscort.availability && (
                <div>
                  <p className="text-sm text-white mb-1">Availability</p>
                  <p className="font-medium">{selectedEscort.availability}</p>
                </div>
              )}
              {selectedEscort.created_at && (
                <div>
                  <p className="text-sm text-white mb-1">Registered</p>
                  <p className="font-medium">
                    {new Date(selectedEscort.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-white mb-1">Verification Status</p>
                <p className="font-medium">
                  {selectedEscort.verified ? (
                    <span className="text-green-600">Verified</span>
                  ) : (
                    <span className="text-white">Unverified</span>
                  )}
                </p>
              </div>
              </div>

              {/* Tags Section */}
              {((selectedEscort.languages?.length ?? 0) > 0 || (selectedEscort.services?.length ?? 0) > 0) && (
                <div className="space-y-4 text-left">
                  {selectedEscort.languages && selectedEscort.languages.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 text-white">Languages</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedEscort.languages.map((lang, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedEscort.services && selectedEscort.services.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 text-white">Services</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedEscort.services.map((service, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-full text-sm font-medium"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingEscort && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingEscort(null)
            setEditFormData({})
          }}
          title="Edit Escort Profile"
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
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  value={editFormData.location ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <input
                  type="text"
                  value={editFormData.gender ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={editFormData.date_of_birth ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, date_of_birth: e.target.value })}
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
                <label className="block text-sm font-medium mb-1">Languages (comma-separated)</label>
                <input
                  type="text"
                  value={editFormData.languages?.join(', ') ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                  placeholder="English, Spanish, French"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Services (comma-separated)</label>
                <input
                  type="text"
                  value={editFormData.services?.join(', ') ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, services: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                  placeholder="Service 1, Service 2"
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
                <label className="block text-sm font-medium mb-1">Bio</label>
                <textarea
                  value={editFormData.bio ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                  rows={4}
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
                  setEditingEscort(null)
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

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { EscortProfile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { CheckCircle, XCircle, Search, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function EscortsPage() {
  const [escorts, setEscorts] = useState<EscortProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all')
  const [selectedEscort, setSelectedEscort] = useState<EscortProfile | null>(null)

  useEffect(() => {
    fetchEscorts()
  }, [])

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
        <div className="text-muted-foreground">Loading escorts...</div>
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
            <CardContent className="py-12 text-center text-muted-foreground">
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
                onClick={() => setSelectedEscort(escort)}
                className="p-4 hover:bg-accent/50 cursor-pointer transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{escort.first_name} {escort.last_name}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground truncate">{escort.email}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm truncate">{escort.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {escort.verified ? (
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
                    onClick={(e) => toggleVerification(e, escort.id!, escort.verified ?? false)}
                    className="whitespace-nowrap"
                  >
                    {escort.verified ? 'Unverify' : 'Verify'}
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
          onClose={() => setSelectedEscort(null)}
          title={`${selectedEscort.first_name} ${selectedEscort.last_name} - Escort Details`}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">First Name</p>
                <p className="font-medium">{selectedEscort.first_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Last Name</p>
                <p className="font-medium">{selectedEscort.last_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="font-medium">{selectedEscort.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Phone</p>
                <p className="font-medium">{selectedEscort.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Location</p>
                <p className="font-medium">{selectedEscort.location}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Gender</p>
                <p className="font-medium">{selectedEscort.gender}</p>
              </div>
              {selectedEscort.date_of_birth && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Date of Birth</p>
                  <p className="font-medium">
                    {new Date(selectedEscort.date_of_birth).toLocaleDateString()}
                  </p>
                </div>
              )}
              {selectedEscort.hourly_rate && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Hourly Rate</p>
                  <p className="font-medium">${selectedEscort.hourly_rate}</p>
                </div>
              )}
              {selectedEscort.availability && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Availability</p>
                  <p className="font-medium">{selectedEscort.availability}</p>
                </div>
              )}
              {selectedEscort.created_at && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Registered</p>
                  <p className="font-medium">
                    {new Date(selectedEscort.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Verification Status</p>
                <p className="font-medium">
                  {selectedEscort.verified ? (
                    <span className="text-green-600">Verified</span>
                  ) : (
                    <span className="text-muted-foreground">Unverified</span>
                  )}
                </p>
              </div>
            </div>
            {selectedEscort.languages && selectedEscort.languages.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Languages</p>
                <div className="flex flex-wrap gap-2">
                  {selectedEscort.languages.map((lang, idx) => (
                    <span key={idx} className="px-2 py-1 bg-muted rounded text-sm">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selectedEscort.services && selectedEscort.services.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Services</p>
                <div className="flex flex-wrap gap-2">
                  {selectedEscort.services.map((service, idx) => (
                    <span key={idx} className="px-2 py-1 bg-muted rounded text-sm">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selectedEscort.bio && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Bio</p>
                <p className="text-sm leading-relaxed">{selectedEscort.bio}</p>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setSelectedEscort(null)}
              >
                Close
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleVerification(e, selectedEscort.id!, selectedEscort.verified ?? false)
                }}
              >
                {selectedEscort.verified ? 'Unverify' : 'Verify'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

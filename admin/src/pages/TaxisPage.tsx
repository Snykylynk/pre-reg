import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { TaxiOwnerProfile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { CheckCircle, XCircle, Search, Car } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function TaxisPage() {
  const [taxis, setTaxis] = useState<TaxiOwnerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all')
  const [selectedTaxi, setSelectedTaxi] = useState<TaxiOwnerProfile | null>(null)

  useEffect(() => {
    fetchTaxis()
  }, [])

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
                onClick={() => setSelectedTaxi(taxi)}
                className="p-4 hover:bg-accent/50 cursor-pointer transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{taxi.first_name} {taxi.last_name}</p>
                  </div>
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
          onClose={() => setSelectedTaxi(null)}
          title={`${selectedTaxi.first_name} ${selectedTaxi.last_name} - Taxi Driver Details`}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
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
            {selectedTaxi.service_areas && selectedTaxi.service_areas.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Service Areas</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTaxi.service_areas.map((area, idx) => (
                    <span key={idx} className="px-2 py-1 bg-muted rounded text-sm">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setSelectedTaxi(null)}
              >
                Close
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleVerification(e, selectedTaxi.id!, selectedTaxi.verified ?? false)
                }}
              >
                {selectedTaxi.verified ? 'Unverify' : 'Verify'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

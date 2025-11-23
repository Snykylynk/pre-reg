import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { TaxiOwnerProfile } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Search } from 'lucide-react'

export function TaxisPage() {
  const [taxis, setTaxis] = useState<TaxiOwnerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all')

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

  const toggleVerification = async (profileId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('taxi_owner_profiles')
        .update({ verified: !currentStatus })
        .eq('id', profileId)

      if (error) throw error
      await fetchTaxis()
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

      <div className="grid gap-4">
        {filteredTaxis.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No taxi drivers found</p>
              <p className="text-sm mt-1">Try adjusting your search or filter criteria</p>
            </CardContent>
          </Card>
        ) : (
          filteredTaxis.map((taxi) => (
            <Card key={taxi.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-transparent hover:border-l-primary">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl mb-1">
                      {taxi.first_name} {taxi.last_name}
                    </CardTitle>
                    <CardDescription className="truncate">{taxi.email}</CardDescription>
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
                      onClick={() => toggleVerification(taxi.id!, taxi.verified ?? false)}
                      className="whitespace-nowrap"
                    >
                      {taxi.verified ? 'Unverify' : 'Verify'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{taxi.phone}</p>
                  </div>
                  {taxi.business_name && (
                    <div>
                      <p className="text-muted-foreground">Business Name</p>
                      <p className="font-medium">{taxi.business_name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">License Number</p>
                    <p className="font-medium">{taxi.license_number}</p>
                  </div>
                  {taxi.vehicle_make && taxi.vehicle_model && (
                    <div>
                      <p className="text-muted-foreground">Vehicle</p>
                      <p className="font-medium">
                        {taxi.vehicle_make} {taxi.vehicle_model}
                        {taxi.vehicle_year && ` (${taxi.vehicle_year})`}
                      </p>
                    </div>
                  )}
                  {taxi.hourly_rate && (
                    <div>
                      <p className="text-muted-foreground">Hourly Rate</p>
                      <p className="font-medium">${taxi.hourly_rate}</p>
                    </div>
                  )}
                  {taxi.created_at && (
                    <div>
                      <p className="text-muted-foreground">Registered</p>
                      <p className="font-medium">
                        {new Date(taxi.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}


import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { EscortProfile } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Search } from 'lucide-react'

export function EscortsPage() {
  const [escorts, setEscorts] = useState<EscortProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all')

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

  const toggleVerification = async (profileId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('escort_profiles')
        .update({ verified: !currentStatus })
        .eq('id', profileId)

      if (error) throw error
      await fetchEscorts()
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

      <div className="grid gap-4">
        {filteredEscorts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No escorts found</p>
              <p className="text-sm mt-1">Try adjusting your search or filter criteria</p>
            </CardContent>
          </Card>
        ) : (
          filteredEscorts.map((escort) => (
            <Card key={escort.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-transparent hover:border-l-primary">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl mb-1">
                      {escort.first_name} {escort.last_name}
                    </CardTitle>
                    <CardDescription className="truncate">{escort.email}</CardDescription>
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
                      onClick={() => toggleVerification(escort.id!, escort.verified ?? false)}
                      className="whitespace-nowrap"
                    >
                      {escort.verified ? 'Unverify' : 'Verify'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{escort.phone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-medium">{escort.location}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gender</p>
                    <p className="font-medium">{escort.gender}</p>
                  </div>
                  {escort.date_of_birth && (
                    <div>
                      <p className="text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">
                        {new Date(escort.date_of_birth).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {escort.languages && escort.languages.length > 0 && (
                    <div>
                      <p className="text-muted-foreground">Languages</p>
                      <p className="font-medium">{escort.languages.join(', ')}</p>
                    </div>
                  )}
                  {escort.services && escort.services.length > 0 && (
                    <div>
                      <p className="text-muted-foreground">Services</p>
                      <p className="font-medium">{escort.services.join(', ')}</p>
                    </div>
                  )}
                  {escort.hourly_rate && (
                    <div>
                      <p className="text-muted-foreground">Hourly Rate</p>
                      <p className="font-medium">${escort.hourly_rate}</p>
                    </div>
                  )}
                  {escort.availability && (
                    <div>
                      <p className="text-muted-foreground">Availability</p>
                      <p className="font-medium">{escort.availability}</p>
                    </div>
                  )}
                  {escort.created_at && (
                    <div>
                      <p className="text-muted-foreground">Registered</p>
                      <p className="font-medium">
                        {new Date(escort.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {escort.bio && (
                    <div className="col-span-full">
                      <p className="text-muted-foreground">Bio</p>
                      <p className="font-medium">{escort.bio}</p>
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


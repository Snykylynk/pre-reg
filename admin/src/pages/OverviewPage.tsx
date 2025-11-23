import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardStats } from '@/lib/types'
import { Users, Car, CheckCircle, Clock } from 'lucide-react'

export function OverviewPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEscorts: 0,
    totalTaxis: 0,
    verifiedEscorts: 0,
    verifiedTaxis: 0,
    recentEscorts: 0,
    recentTaxis: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch all escorts
      const { data: escorts, error: escortsError } = await supabase
        .from('escort_profiles')
        .select('id, verified, created_at')

      // Fetch all taxis
      const { data: taxis, error: taxisError } = await supabase
        .from('taxi_owner_profiles')
        .select('id, verified, created_at')

      // Log errors and data for debugging
      if (escortsError) {
        console.error('Error fetching escorts:', escortsError)
        setError(`Escorts error: ${escortsError.message}`)
      }
      if (taxisError) {
        console.error('Error fetching taxis:', taxisError)
        setError(prev => prev ? `${prev}; Taxis error: ${taxisError.message}` : `Taxis error: ${taxisError.message}`)
      }

      console.log('Fetched escorts:', escorts?.length ?? 0, escorts)
      console.log('Fetched taxis:', taxis?.length ?? 0, taxis)

      // Don't return early on error - still try to process what we got
      const escortData = escorts ?? []
      const taxiData = taxis ?? []

      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const verifiedEscorts = escortData.filter(e => e.verified).length
      const verifiedTaxis = taxiData.filter(t => t.verified).length
      const recentEscorts = escortData.filter(e => {
        if (!e.created_at) return false
        return new Date(e.created_at) >= sevenDaysAgo
      }).length
      const recentTaxis = taxiData.filter(t => {
        if (!t.created_at) return false
        return new Date(t.created_at) >= sevenDaysAgo
      }).length

      setStats({
        totalEscorts: escortData.length,
        totalTaxis: taxiData.length,
        verifiedEscorts,
        verifiedTaxis,
        recentEscorts,
        recentTaxis,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading statistics...</div>
      </div>
    )
  }

  const taxiCards = [
    {
      title: 'Total Taxis',
      value: stats.totalTaxis,
      icon: Car,
      description: 'Registered taxi drivers',
    },
    {
      title: 'Verified Taxis',
      value: stats.verifiedTaxis,
      icon: CheckCircle,
      description: 'Verified taxi drivers',
    },
    {
      title: 'New Taxis (7d)',
      value: stats.recentTaxis,
      icon: Clock,
      description: 'Registered in last 7 days',
    },
  ]

  const escortCards = [
    {
      title: 'Total Escorts',
      value: stats.totalEscorts,
      icon: Users,
      description: 'Registered escort profiles',
    },
    {
      title: 'Verified Escorts',
      value: stats.verifiedEscorts,
      icon: CheckCircle,
      description: 'Verified escort profiles',
    },
    {
      title: 'New Escorts (7d)',
      value: stats.recentEscorts,
      icon: Clock,
      description: 'Registered in last 7 days',
    },
  ]

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg text-sm text-destructive">
          <strong>Error:</strong> {error}
          <br />
          <span className="text-xs mt-1 block">Check browser console for details</span>
        </div>
      )}

      {/* Taxis Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Car className="h-5 w-5 text-primary" />
          Taxi Drivers
        </h2>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          {taxiCards.map((stat) => (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">{stat.title}</CardTitle>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <CardDescription className="text-xs">{stat.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Escorts Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Escorts
        </h2>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          {escortCards.map((stat) => (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">{stat.title}</CardTitle>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <CardDescription className="text-xs">{stat.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}


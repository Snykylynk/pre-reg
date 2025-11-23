import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { isAdmin } from '@/lib/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const adminStatus = await isAdmin()
      setIsAuthorized(adminStatus)
      setLoading(false)
    }
    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Checking authorization...</div>
      </div>
    )
  }

  if (!isAuthorized) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}


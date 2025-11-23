import { useLocation } from 'react-router-dom'
import { LayoutDashboard, Car, Users } from 'lucide-react'

const pageTitles: Record<string, { title: string; icon: typeof LayoutDashboard }> = {
  '/': { title: 'Dashboard Overview', icon: LayoutDashboard },
  '/taxis': { title: 'Taxi Drivers', icon: Car },
  '/escorts': { title: 'Escorts', icon: Users },
}

export function TopNav() {
  const location = useLocation()
  const pageInfo = pageTitles[location.pathname] ?? { title: 'Admin Dashboard', icon: LayoutDashboard }
  const Icon = pageInfo.icon

  return (
    <header className="fixed top-0 left-0 right-0 md:left-64 h-16 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border z-40 shadow-sm">
      <div className="h-full flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">{pageInfo.title}</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-sm text-white px-3 py-1.5 rounded-md bg-muted/50">
            Admin Portal
          </div>
        </div>
      </div>
    </header>
  )
}


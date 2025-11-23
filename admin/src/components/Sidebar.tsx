import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Car, Users, LogOut } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/auth'
import { useNavigate } from 'react-router-dom'

const navigation = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Taxis', href: '/taxis', icon: Car },
  { name: 'Escorts', href: '/escorts', icon: Users },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="fixed left-0 top-0 h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border hidden md:flex">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <h1 className="text-xl font-bold text-sidebar-foreground">Snyk Lynk Admin</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}


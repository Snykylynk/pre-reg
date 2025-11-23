import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Car, Users } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground">
            Snyky Lynk
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            On-Demand Taxi & Escort Services
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect with professional drivers and escorts. Join our platform today and start your journey.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
          <Link to="/prereg">
            <Button size="lg" className="w-full sm:w-auto min-w-[200px]">
              Pre-Register Now
            </Button>
          </Link>
          <Link to="/signin">
            <Button size="lg" variant="outline" className="w-full sm:w-auto min-w-[200px]">
              Sign In
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-16">
          <div className="p-6 rounded-lg border bg-card">
            <Car className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Taxi Services</h3>
            <p className="text-muted-foreground">
              Professional drivers ready to take you where you need to go, when you need to go.
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Escort Services</h3>
            <p className="text-muted-foreground">
              Verified escorts available for companionship and social events.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


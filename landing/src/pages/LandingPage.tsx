import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Car, Users } from 'lucide-react'
import MapBackground from '@/components/MapBackground'

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time for premium feel
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <MapBackground />
        <div className="absolute inset-0 bg-background/10 z-[1]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <MapBackground />
      <div className="absolute inset-0 bg-background/10 z-[1]" />
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-4xl w-full text-center space-y-8 relative z-10">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-white fade-in-up" style={{ fontFamily: "'Libre Baskerville', serif", animationDelay: '0.1s' }}>
            Snyky<p>Lynk</p>
          </h1>
          <p className="text-xl md:text-2xl text-white font-black fade-in-up" style={{ animationDelay: '0.3s' }}>
            SNL
          </p>
          <p className="text-lg text-white max-w-2xl mx-auto fade-in-up" style={{ animationDelay: '0.5s' }}>
            Coming Soon to{' '}
            <span className="text-[#FFD700] font-black" style={{ 
              textShadow: '0 0 10px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.4)' 
            }}>
              South Africa.
            </span>
          </p>
          <p className="text-lg text-white max-w-2xl mx-auto uppercase font-light mt-12 fade-in-up" style={{ animationDelay: '0.7s' }}>
            Premium Experiences Across Gauteng
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="p-6 rounded-lg border border-white/30 transition-all duration-300 ease-in-out hover:border-white/50 hover:bg-card fade-in-up" style={{ animationDelay: '0.9s' }}>
            <Car className="w-12 h-12 mx-auto mb-4 text-primary icon-pulse" />
            <h3 className="text-xl font-semibold mb-2 text-white">Personal Chauffeur Services</h3>
            <p className="text-white/90">
              Professional Chauffeurs ready to take you where you need to go, when you need to go.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-white/30 transition-all duration-300 ease-in-out hover:border-white/50 hover:bg-card fade-in-up" style={{ animationDelay: '1.1s' }}>
            <Users className="w-12 h-12 mx-auto mb-4 text-primary icon-pulse" />
            <h3 className="text-xl font-semibold mb-2 text-white">Companionship</h3>
            <p className="text-white/90">
              Verified Baddies and Queens available for companionship and social events.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-24 fade-in-up" style={{ animationDelay: '1.3s' }}>
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
        </div>
      </div>
      
      <footer className="w-full py-6 px-4 text-center relative z-10 fade-in" style={{ animationDelay: '1.5s' }}>
        <div className="max-w-4xl mx-auto space-y-3">
          <p className="text-sm text-white/80">
            Need help? Check our{' '}
            <Link to="/faq" className="text-[#FFD700] font-medium hover:text-[#FFD700]/80">
              FAQ
            </Link>
          </p>
          <p className="text-xs text-white/60">
            By continuing, you agree to our{' '}
            <Link to="/terms" className="text-[#FFD700] font-medium hover:text-[#FFD700]/80">
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-[#FFD700] font-medium hover:text-[#FFD700]/80">
              Privacy Policy
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}


import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Car, Users, ArrowLeft } from 'lucide-react'

export default function PreRegPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        <Link to="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Pre-Registration
          </h1>
          <p className="text-xl text-muted-foreground">
            Choose your registration type to get started
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="w-12 h-12 mb-4 text-primary" />
              <CardTitle>Escort Registration</CardTitle>
              <CardDescription>
                Join as a professional escort and start offering your services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/register/escort">
                <Button className="w-full" size="lg">
                  Register as Escort
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Car className="w-12 h-12 mb-4 text-primary" />
              <CardTitle>Taxi Owner Registration</CardTitle>
              <CardDescription>
                Register your taxi service and start driving with us
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/register/taxi">
                <Button className="w-full" size="lg">
                  Register as Taxi Owner
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


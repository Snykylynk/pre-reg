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
          <Card className="hover:shadow-lg transition-shadow flex flex-col">
            <CardHeader>
              <Users className="w-12 h-12 mb-4 text-primary" />
              <CardTitle>Companion Registration</CardTitle>
              <CardDescription>
                Join as a professional companion and start offering your services
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-end">
              <Link to="/register/escort" className="w-full">
                <Button className="w-full" size="lg">
                  Register as Companion
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow flex flex-col">
            <CardHeader>
              <Car className="w-12 h-12 mb-4 text-primary" />
              <CardTitle>Personal Chauffeur Registration</CardTitle>
              <CardDescription>
                Register your personal chauffeur service and start driving with us
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-end">
              <Link to="/register/taxi" className="w-full">
                <Button className="w-full" size="lg">
                  Register as Personal Chauffeur
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


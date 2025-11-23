import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      if (data.user) {
        // Check if user has a profile
        const { data: escortProfile } = await supabase
          .from('escort_profiles')
          .select('id')
          .eq('user_id', data.user.id)
          .single()

        const { data: taxiProfile } = await supabase
          .from('taxi_owner_profiles')
          .select('id')
          .eq('user_id', data.user.id)
          .single()

        if (escortProfile) {
          navigate('/profile/escort')
        } else if (taxiProfile) {
          navigate('/profile/taxi')
        } else {
          navigate('/prereg')
        }
      }
    } catch (err: any) {
      if (err.message?.includes('Email not confirmed') || err.message?.includes('email_not_confirmed')) {
        setEmailNotConfirmed(true)
        setError('Please confirm your email address before signing in. Check your inbox for the confirmation email.')
      } else {
        setError(err.message ?? 'An error occurred during sign in')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email address first')
      return
    }

    setResending(true)
    setError(null)
    setResendSuccess(false)

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (resendError) throw resendError

      setResendSuccess(true)
      setEmailNotConfirmed(false)
    } catch (err: any) {
      setError(err.message ?? 'Failed to resend confirmation email')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <Link to="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              {error && (
                <div className={`p-3 rounded-md text-sm ${
                  emailNotConfirmed 
                    ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' 
                    : 'bg-destructive/10 text-destructive'
                }`}>
                  {error}
                </div>
              )}
              {resendSuccess && (
                <div className="p-3 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-sm">
                  Confirmation email sent! Please check your inbox and click the confirmation link.
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setEmailNotConfirmed(false)
                    setResendSuccess(false)
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
              {emailNotConfirmed && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground text-center">
                    Didn't receive the email?
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleResendConfirmation}
                    disabled={resending || !email}
                  >
                    {resending ? 'Sending...' : 'Resend Confirmation Email'}
                  </Button>
                </div>
              )}
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/prereg" className="text-primary hover:underline">
                Pre-register here
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


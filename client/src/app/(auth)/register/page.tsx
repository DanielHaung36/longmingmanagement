'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Eye, EyeOff, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { message } from '@/lib/message'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRegisterMutation } from '@/state/api'
import { validatePasswordStrength } from '@/lib/passwordValidation'

export default function RegisterPage() {
  const router = useRouter()

  // RTK Query mutation
  const [register, { isLoading }] = useRegisterMutation()

  // Form state
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [realName, setRealName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  /**
   * Handle registration
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      setErrorMessage('Please fill in all required fields')
      message.error('Please fill in all required fields')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match')
      message.error('Passwords do not match')
      return
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      setErrorMessage(passwordValidation.message || 'Password does not meet requirements')
      message.error(passwordValidation.message || 'Password does not meet requirements')
      return
    }

    try {
      console.log('[Register] Attempting registration...', { username, email })

      // Call register API
      const result = await register({
        username,
        email,
        password,
        realName: realName || undefined,
        phone: phone || undefined,
      }).unwrap()

      console.log('[Register] Registration successful', result)

      if (result.success) {
        message.success('Registration successful! Redirecting to login...')

        // Redirect to login page after 1.5s
        setTimeout(() => {
          router.push('/login')
        }, 1500)
      } else {
        throw new Error(result.message || 'Registration failed')
      }
    } catch (err: any) {
      console.error('[Register] Registration failed', err)

      const errorMsg =
        err?.data?.message ||
        err?.message ||
        'Registration failed. Please try again'

      setErrorMessage(errorMsg)
      message.error(errorMsg)
    }
  }

  return (
    <div className="flex min-h-screen font-sans">
      <div className="relative hidden overflow-hidden bg-blue-500 lg:flex lg:w-1/2">
        <div className="relative z-10 flex w-full flex-col justify-between px-12 py-12">
          <div className="flex items-center">
            <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white">
              <div className="h-4 w-4 rounded-sm bg-red-600"></div>
            </div>
            <h1 className="text-xl font-semibold text-white">LONGi</h1>
          </div>

          <div className="flex flex-1 flex-col justify-center">
            <h2 className="mb-6 text-4xl leading-tight text-white">
              Join our mining management platform.
            </h2>
            <p className="text-lg leading-relaxed text-white/90">
              Create your account to start managing your mining projects efficiently.
            </p>
          </div>

          <div className="flex items-center justify-between text-sm text-white/70">
            <span>Copyright © 2025 Longi Magnet Australia Pty Ltd.</span>
            <span className="cursor-pointer hover:text-white/90">Privacy Policy</span>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-white p-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-red-600">
              <div className="h-4 w-4 rounded-sm bg-white"></div>
            </div>
            <h1 className="text-foreground text-xl font-semibold">LONGi</h1>
          </div>

          <div className="space-y-6">
            <Link
              href="/login"
              className="absolute top-8 left-8 cursor-pointer rounded-lg p-2 hover:bg-gray-100 lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="space-y-2 text-center">
              <h2 className="text-foreground text-3xl">Create Account</h2>
              <p className="text-muted-foreground">
                Create a new account to get started with LONGi.
              </p>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground text-sm font-medium">
                  Username <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12 rounded-lg border-gray-200 bg-white shadow-none focus:border-red-500 focus:ring-0"
                  disabled={isLoading}
                  required
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground text-sm font-medium">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@ljmagnet.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-lg border-gray-200 bg-white shadow-none focus:border-red-500 focus:ring-0"
                  disabled={isLoading}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="realName" className="text-foreground text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="realName"
                  type="text"
                  placeholder="John Doe"
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  className="h-12 rounded-lg border-gray-200 bg-white shadow-none focus:border-red-500 focus:ring-0"
                  disabled={isLoading}
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground text-sm font-medium">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+61 400 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12 rounded-lg border-gray-200 bg-white shadow-none focus:border-red-500 focus:ring-0"
                  disabled={isLoading}
                  autoComplete="tel"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground text-sm font-medium">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-lg border-gray-200 bg-white pr-10 shadow-none focus:border-red-500 focus:ring-0"
                    disabled={isLoading}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-0 right-0 h-full cursor-pointer px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="text-muted-foreground h-4 w-4" />
                    ) : (
                      <Eye className="text-muted-foreground h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters and include uppercase, lowercase, and a number.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground text-sm font-medium">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 rounded-lg border-gray-200 bg-white pr-10 shadow-none focus:border-red-500 focus:ring-0"
                    disabled={isLoading}
                    required
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-0 right-0 h-full cursor-pointer px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="text-muted-foreground h-4 w-4" />
                    ) : (
                      <Eye className="text-muted-foreground h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="h-12 w-full cursor-pointer rounded-lg bg-red-500 text-sm font-medium text-white shadow-none hover:bg-red-600 hover:opacity-90 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="text-muted-foreground text-center text-sm">
              Already Have An Account?{' '}
              <Link
                href="/login"
                className="cursor-pointer font-medium text-red-500 hover:text-red-600"
              >
                Sign In.
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

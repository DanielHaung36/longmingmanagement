'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { message } from '@/lib/message'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const router = useRouter()

  const handleForgotPassword = async () => {
    if (!email) {
      message.error('Please enter your email address.')
      return
    }

    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      message.success(
        "We've sent a password reset link to your email. Please check your inbox and follow the instructions to reset your password."
      )

      // Navigate to confirmation page
      router.push(`/reset-sent?email=${encodeURIComponent(email)}`)
    } catch (error) {
      message.error('Failed to send reset link. Please try again.')
    } finally {
      setIsLoading(false)
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
              Forgot your password? No problem.
            </h2>
            <p className="text-lg leading-relaxed text-white/90">
              Enter your email address and we'll send you a link to reset your password.
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
              <h2 className="text-foreground text-3xl">Reset Password</h2>
              <p className="text-muted-foreground">
                Enter your email address and we'll send you a reset link.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@ljmagnet.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-lg border-gray-200 bg-white shadow-none focus:border-red-500 focus:ring-0"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              className="h-12 w-full cursor-pointer rounded-lg bg-red-500 text-sm font-medium text-white shadow-none hover:bg-red-600 hover:opacity-90 disabled:opacity-50"
              disabled={isLoading}
              onClick={handleForgotPassword}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>

            <div className="text-muted-foreground text-center text-sm">
              Remember Your Password?{' '}
              <Link
                href="/login"
                className="cursor-pointer font-medium text-red-500 hover:text-red-600"
              >
                Back to Login.
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

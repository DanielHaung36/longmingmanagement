'use client'

import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function ResetSentPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

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
              Check your email for the reset link.
            </h2>
            <p className="text-lg leading-relaxed text-white/90">
              We've sent detailed instructions to help you reset your password securely.
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
            <div className="space-y-2 text-center">
              <h2 className="text-foreground text-3xl">Check Your Email</h2>
              <p className="text-muted-foreground">
                We've sent a password reset link to your email address. Please check your inbox and
                follow the instructions.
              </p>
            </div>

            <div className="space-y-4 text-center">
              <div className="mb-4 flex items-center justify-center">
                <Mail className="h-16 w-16 text-red-500" />
              </div>

              {email && (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">
                    A password reset link has been sent to:
                  </p>
                  <p className="text-foreground font-medium">{email}</p>
                </div>
              )}

              <div className="rounded-lg bg-gray-50 p-4 text-left">
                <h4 className="mb-2 text-sm font-medium">Next steps:</h4>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>• Check your email inbox (and spam folder)</li>
                  <li>• Click the reset link in the email</li>
                  <li>• Create a new password</li>
                  <li>• Return to login with your new password</li>
                </ul>
              </div>

              <Button variant="outline" asChild className="w-full">
                <Link href="/forgot-password" className="font-sans text-white">
                  Didn't receive the email? Try again
                </Link>
              </Button>
            </div>

            <div className="text-muted-foreground text-center text-sm">
              Back to{' '}
              <Link
                href="/login"
                className="cursor-pointer font-medium text-red-500 hover:text-red-600"
              >
                Login Page.
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

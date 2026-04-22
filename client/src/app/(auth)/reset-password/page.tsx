"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, CheckCircle, ArrowLeft } from "lucide-react"
import { message } from "antd"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { validatePasswordStrength } from "@/lib/passwordValidation"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidToken, setIsValidToken] = useState(true)
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  useEffect(() => {
    // Validate token on page load
    if (!token) {
      setIsValidToken(false)
      message.error("This password reset link is invalid or has expired.")
    }
  }, [token])

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      message.error("Please fill in all fields.")
      return
    }

    if (password !== confirmPassword) {
      message.error("Passwords do not match.")
      return
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      message.error(passwordValidation.message || "Password does not meet requirements.")
      return
    }

    setIsLoading(true)
    try {
      // Simulate API call to reset password
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate success/failure
      const isSuccess = Math.random() > 0.1

      if (isSuccess) {
        setIsSuccess(true)
        message.success("Your password has been updated successfully.")
      } else {
        throw new Error("Reset failed")
      }
    } catch (error) {
      message.error("Failed to reset password. Please try again or request a new reset link.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Invalid Reset Link</h2>
            <p className="mt-2 text-sm text-gray-600">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <div className="mt-6">
              <Link href="/">
                <Button className="w-full bg-red-500 hover:bg-red-600 text-white">Back to Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Password Reset Complete</h2>
            <p className="mt-2 text-sm text-gray-600">
              Your password has been successfully updated. You can now log in with your new password.
            </p>
            <div className="mt-6">
              <Link href="/">
                <Button className="w-full bg-red-500 hover:bg-red-600 text-white">Continue to Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex font-sans">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-red-500">
        <div className="relative z-10 flex flex-col justify-between w-full px-12 py-12">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3">
              <div className="w-4 h-4 rounded-sm bg-red-600"></div>
            </div>
            <h1 className="text-xl font-semibold text-white">LONGi</h1>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-4xl text-white mb-6 leading-tight">Reset your password securely.</h2>
            <p className="text-white/90 text-lg leading-relaxed">
              Create a new password for your LONGi Mining Management System account.
            </p>
          </div>

          <div className="flex justify-between items-center text-white/70 text-sm">
            <span>Copyright © 2025 Longi Magnet Australia Pty Ltd.</span>
            <span className="cursor-pointer hover:text-white/90">Privacy Policy</span>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center mb-8">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-3">
              <div className="w-4 h-4 rounded-sm bg-white"></div>
            </div>
            <h1 className="text-xl font-semibold text-foreground">LONGi</h1>
          </div>

          <div className="space-y-6">
            <Link href="/">
              <Button variant="ghost" className="absolute left-8 top-8 p-2 hover:bg-gray-100 cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>

            <div className="space-y-2 text-center">
              <h2 className="text-3xl text-foreground">Reset Your Password</h2>
              <p className="text-muted-foreground">
                Enter your new password below. Make sure it's at least 8 characters long.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pr-10 border-gray-200 focus:ring-0 shadow-none rounded-lg bg-white focus:border-red-500"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 pr-10 border-gray-200 focus:ring-0 shadow-none rounded-lg bg-white focus:border-red-500"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent cursor-pointer"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Must be at least 8 characters and include uppercase, lowercase, and a number.
              </div>
            </div>

            <Button
              className="w-full h-12 text-sm font-medium text-white hover:opacity-90 rounded-lg shadow-none cursor-pointer bg-red-500 hover:bg-red-600 disabled:opacity-50"
              disabled={isLoading}
              onClick={handleResetPassword}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Updating Password..." : "Update Password"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link href="/">
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm hover:text-opacity-80 font-medium cursor-pointer text-red-500"
                >
                  Back to Login.
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

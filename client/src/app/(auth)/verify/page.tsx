"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, Mail } from "lucide-react"
import { message } from "antd"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

export default function VerifyPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [verificationCode, setVerificationCode] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const sendVerificationCode = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setCountdown(60)
      message.success("Please check your email for the verification code.")
    } catch (error) {
      message.error("Failed to send verification code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerification = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      message.error("Please enter a valid 6-digit verification code.")
      return
    }

    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simulate success/failure
      const isSuccess = Math.random() > 0.2

      if (isSuccess) {
        message.success("Welcome! Your account has been created.")
        router.push("/login")
      } else {
        throw new Error("Invalid verification code")
      }
    } catch (error) {
      message.error("Invalid verification code. Please try again.")
    } finally {
      setIsLoading(false)
    }
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
            <h2 className="text-4xl text-white mb-6 leading-tight">Almost there! Verify your email.</h2>
            <p className="text-white/90 text-lg leading-relaxed">
              We've sent a verification code to your email. Enter it below to complete your registration.
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
            <Link href="/register" className="absolute left-8 top-8 p-2 hover:bg-gray-100 cursor-pointer rounded-lg">
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="space-y-2 text-center">
              <h2 className="text-3xl text-foreground">Verify Your Email</h2>
              <p className="text-muted-foreground">Enter the 6-digit verification code sent to your email.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center mb-4">
                <Mail className="h-12 w-12 text-red-500" />
              </div>

              {email && (
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">Verification code sent to:</p>
                  <p className="font-medium text-foreground">{email}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="verificationCode" className="text-sm font-medium text-foreground">
                  Verification Code
                </Label>
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-12 border-gray-200 focus:ring-0 shadow-none rounded-lg bg-white focus:border-red-500 text-center text-lg tracking-widest"
                  maxLength={6}
                  disabled={isLoading}
                />
              </div>

              <div className="text-center">
                <Button
                  variant="link"
                  onClick={sendVerificationCode}
                  disabled={countdown > 0 || isLoading}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  {countdown > 0 ? `Resend code in ${countdown}s` : "Resend verification code"}
                </Button>
              </div>
            </div>

            <Button
              className="w-full h-12 text-sm font-medium text-white hover:opacity-90 rounded-lg shadow-none cursor-pointer bg-red-500 hover:bg-red-600 disabled:opacity-50"
              disabled={isLoading}
              onClick={handleVerification}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Verifying..." : "Verify Code"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Didn't receive the code?{" "}
              <Link href="/register" className="text-red-500 hover:text-red-600 font-medium cursor-pointer">
                Try registering again.
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

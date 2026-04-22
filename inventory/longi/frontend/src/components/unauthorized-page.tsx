"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Home, Mail, ArrowLeft, Shield } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function UnauthorizedPage() {
  const router = useNavigate()

  const handleGoHome = () => {
    router("/")
  }

  const handleGoBack = () => {
    router(-1)
  }

  const handleContactSupport = () => {
    // You can customize this to open email client or support system
    window.location.href = "mailto:support@longi.com?subject=Access Request"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="shadow-2xl border-0 overflow-hidden">
          <CardContent className="p-0">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-white/20 p-4 rounded-full">
                  <Shield className="h-12 w-12" />
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-2">Access Denied</h1>
              <p className="text-red-100 text-lg">You don't have permission to view this page</p>
            </div>

            {/* Content Section */}
            <div className="p-8 text-center">
              <div className="mb-8">
                <div className="flex justify-center mb-6">
                  <div className="bg-red-50 p-6 rounded-full">
                    <AlertTriangle className="h-16 w-16 text-red-500" />
                  </div>
                </div>

                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Oops! You're not authorized</h2>

                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  It looks like you don't have the necessary permissions to access this resource. This could be because:
                </p>

                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                  <ul className="text-left text-gray-700 space-y-3">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-3 mt-1">•</span>
                      Your account doesn't have the required role or permissions
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-3 mt-1">•</span>
                      You may need to request access from your administrator
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-3 mt-1">•</span>
                      Your session might have expired or been revoked
                    </li>
                  </ul>
                </div>

                <div className="text-sm text-gray-500 mb-8">
                  <p>
                    Error Code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">403 - Forbidden</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={handleGoBack} variant="outline" className="flex items-center gap-2 px-6 py-3">
                  <ArrowLeft className="h-4 w-4" />
                  Go Back
                </Button>

                <Button
                  onClick={handleGoHome}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700"
                >
                  <Home className="h-4 w-4" />
                  Go to Dashboard
                </Button>

                <Button
                  onClick={handleContactSupport}
                  variant="outline"
                  className="flex items-center gap-2 px-6 py-3 border-green-200 text-green-700 hover:bg-green-50"
                >
                  <Mail className="h-4 w-4" />
                  Request Access
                </Button>
              </div>

              {/* Additional Help */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Need Help?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Contact Administrator</h4>
                    <p className="text-blue-700">
                      Reach out to your system administrator to request the necessary permissions for this resource.
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Check Your Role</h4>
                    <p className="text-green-700">
                      Verify that your account has been assigned the correct role and permissions for your job function.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>If you believe this is an error, please contact our support team.</p>
          <p className="mt-2">
            <a href="mailto:support@longi.com" className="text-blue-600 hover:text-blue-800 underline">
              support@longi.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

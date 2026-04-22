"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Home, ArrowLeft, Search } from "lucide-react"

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="max-w-2xl w-full shadow-2xl border-none">
        <CardContent className="p-12 text-center space-y-8">
          {/* Animated 404 Icon */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            </div>
            <div className="relative flex items-center justify-center gap-4">
              <span className="text-9xl font-black text-primary/20">4</span>
              <AlertCircle className="w-24 h-24 text-primary animate-bounce" />
              <span className="text-9xl font-black text-primary/20">4</span>
            </div>
          </div>

          {/* Title and Description */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground">
              Page Not Found
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Sorry, the page you are looking for does not exist or has been removed.
              Please check the URL or return to the homepage.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto gap-2 hover-lift"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>

            <Button
              onClick={() => router.push("/")}
              size="lg"
              className="w-full sm:w-auto gap-2 hover-lift"
            >
              <Home className="w-4 h-4" />
              Home
            </Button>

            <Button
              onClick={() => router.push("/projects")}
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto gap-2 hover-lift"
            >
              <Search className="w-4 h-4" />
              Browse Projects
            </Button>
          </div>

          {/* Footer Note */}
          <div className="pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Need help? Contact{" "}
              <a
                href="mailto:support@longi.com"
                className="text-primary hover:underline font-medium"
              >
                technical support
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

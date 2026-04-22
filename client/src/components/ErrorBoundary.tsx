"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Error Boundary Component
 * Catches React errors and displays a fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Error Boundary] Caught error:", error)
    console.error("[Error Boundary] Error info:", errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    // You can also log the error to an error reporting service here
    // logErrorToService(error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = "/"
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/5 via-background to-destructive/5 p-4">
          <Card className="max-w-2xl w-full shadow-2xl border-destructive/20">
            <CardContent className="p-12 text-center space-y-8">
              {/* Error Icon */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-destructive/10 rounded-full blur-3xl animate-pulse" />
                </div>
                <div className="relative flex items-center justify-center">
                  <AlertTriangle className="w-24 h-24 text-destructive animate-pulse" />
                </div>
              </div>

              {/* Title and Description */}
              <div className="space-y-4">
                <h1 className="text-4xl font-bold text-foreground">
                  Something Went Wrong
                </h1>
                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                  We encountered an unexpected error. Don't worry, your data is safe.
                  Try refreshing the page or contact support if the problem persists.
                </p>
              </div>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="text-left bg-muted/50 rounded-lg p-4 max-w-full overflow-auto">
                  <summary className="cursor-pointer font-semibold text-destructive mb-2">
                    Error Details (Development Only)
                  </summary>
                  <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap break-words">
                    <strong>Error:</strong> {this.state.error.toString()}
                    {"\n\n"}
                    <strong>Stack Trace:</strong>
                    {"\n"}
                    {this.state.error.stack}
                    {this.state.errorInfo && (
                      <>
                        {"\n\n"}
                        <strong>Component Stack:</strong>
                        {"\n"}
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>

                <Button
                  onClick={this.handleReload}
                  size="lg"
                  className="w-full sm:w-auto gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
              </div>

              {/* Footer Note */}
              <div className="pt-8 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  If this error continues, please contact{" "}
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

    return this.props.children
  }
}

/**
 * Hook-based Error Boundary wrapper
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

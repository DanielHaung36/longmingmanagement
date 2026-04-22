import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

/**
 * Spinner Loading Component
 */
interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  }

  return (
    <Loader2
      className={cn("animate-spin text-primary", sizeClasses[size], className)}
    />
  )
}

/**
 * Full Page Loading Component
 */
interface FullPageLoadingProps {
  message?: string
}

export function FullPageLoading({ message = "Loading..." }: FullPageLoadingProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="xl" />
        {message && (
          <p className="text-lg font-medium text-muted-foreground animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Card Loading Overlay
 */
interface CardLoadingProps {
  message?: string
}

export function CardLoading({ message }: CardLoadingProps) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        {message && (
          <p className="text-sm font-medium text-muted-foreground">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Inline Loading Component
 */
interface InlineLoadingProps {
  message?: string
  size?: "sm" | "md" | "lg"
}

export function InlineLoading({ message, size = "md" }: InlineLoadingProps) {
  return (
    <div className="flex items-center gap-2">
      <Spinner size={size} />
      {message && (
        <span className="text-sm text-muted-foreground">{message}</span>
      )}
    </div>
  )
}

/**
 * Button Loading State
 */
export function ButtonLoading() {
  return <Spinner size="sm" className="mr-2" />
}

/**
 * Dots Loading Animation
 */
export function DotsLoading() {
  return (
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
    </div>
  )
}

/**
 * Pulse Loading Animation
 */
export function PulseLoading() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
      <div className="w-3 h-3 bg-primary/70 rounded-full animate-pulse [animation-delay:0.2s]" />
      <div className="w-3 h-3 bg-primary/50 rounded-full animate-pulse [animation-delay:0.4s]" />
    </div>
  )
}

/**
 * Progress Bar Loading
 */
interface ProgressBarProps {
  progress?: number // 0-100
  className?: string
}

export function ProgressBar({ progress, className }: ProgressBarProps) {
  const isIndeterminate = progress === undefined

  return (
    <div className={cn("w-full h-2 bg-muted rounded-full overflow-hidden", className)}>
      <div
        className={cn(
          "h-full bg-primary rounded-full transition-all duration-300",
          isIndeterminate && "animate-progress-indeterminate"
        )}
        style={{ width: isIndeterminate ? "30%" : `${progress}%` }}
      />
    </div>
  )
}

import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

export interface EnhancedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
  required?: boolean
}

const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ className, type, label, error, helperText, icon, required, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
            {required && <span className="ml-1 text-rose-500">*</span>}
          </Label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            className={cn(
              "flex h-11 w-full rounded-lg border bg-white px-4 py-2 text-sm shadow-sm transition-all",
              "placeholder:text-slate-400",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-0",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "dark:bg-slate-950 dark:border-slate-800 dark:placeholder:text-slate-500",
              error
                ? "border-rose-300 focus-visible:ring-rose-400 dark:border-rose-800"
                : "border-slate-200 dark:border-slate-800",
              icon && "pl-10",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {(error || helperText) && (
          <p className={cn(
            "text-xs",
            error ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)
EnhancedInput.displayName = "EnhancedInput"

export { EnhancedInput }

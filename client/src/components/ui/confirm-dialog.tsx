"use client"

import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ConfirmDialogType = "info" | "success" | "warning" | "danger"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  type?: ConfirmDialogType
  loading?: boolean
}

const typeConfig = {
  info: {
    icon: Info,
    iconClass: "text-blue-500",
    bgClass: "bg-blue-50 dark:bg-blue-950",
    confirmClass: "bg-blue-600 hover:bg-blue-700",
  },
  success: {
    icon: CheckCircle2,
    iconClass: "text-emerald-500",
    bgClass: "bg-emerald-50 dark:bg-emerald-950",
    confirmClass: "bg-emerald-600 hover:bg-emerald-700",
  },
  warning: {
    icon: AlertCircle,
    iconClass: "text-amber-500",
    bgClass: "bg-amber-50 dark:bg-amber-950",
    confirmClass: "bg-amber-600 hover:bg-amber-700",
  },
  danger: {
    icon: XCircle,
    iconClass: "text-rose-500",
    bgClass: "bg-rose-50 dark:bg-rose-950",
    confirmClass: "bg-rose-600 hover:bg-rose-700",
  },
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info",
  loading = false,
}: ConfirmDialogProps) {
  const config = typeConfig[type]
  const Icon = config.icon

  const handleConfirm = async () => {
    await onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        <div className={cn("absolute top-0 left-0 right-0 h-1", config.confirmClass)} />

        <DialogHeader className="space-y-4">
          <div className="flex items-start gap-4">
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-full shrink-0", config.bgClass)}>
              <Icon className={cn("h-6 w-6", config.iconClass)} />
            </div>
            <div className="flex-1 pt-1">
              <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
              {description && (
                <DialogDescription className="mt-2 text-sm leading-relaxed">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="transition-all hover:scale-105"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              "transition-all hover:scale-105",
              config.confirmClass
            )}
          >
            {loading ? "Processing..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

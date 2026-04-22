"use client"

import { toast } from "@/components/ui/use-toast"

type MessageArgs =
  | string
  | {
      content?: string
      duration?: number
      key?: string
    }

type MessageType = "success" | "error" | "info" | "warning" | "loading"

interface ToastHandler {
  id: string
  dismiss: () => void
  update: (props: any) => void
}

const activeToasts = new Map<string, ToastHandler>()
const dismissTimers = new Map<string, ReturnType<typeof setTimeout>>()

function normalizeArgs(args: MessageArgs) {
  if (typeof args === "string") {
    return { content: args }
  }
  return args || {}
}

function getDefaultTitle(type: MessageType) {
  switch (type) {
    case "success":
      return "Success"
    case "error":
      return "Error"
    case "warning":
      return "Warning"
    case "loading":
      return "Loading"
    default:
      return "Info"
  }
}

function getVariant(type: MessageType) {
  if (type === "error" || type === "warning") {
    return "destructive" as const
  }
  return "default" as const
}

function scheduleDismiss(key: string | undefined, handler: ToastHandler, seconds?: number) {
  if (seconds === undefined || seconds <= 0) {
    return
  }

  const timeout = setTimeout(() => {
    handler.dismiss()
    if (key) {
      activeToasts.delete(key)
      dismissTimers.delete(key)
    }
  }, seconds * 1000)

  if (key) {
    const existingTimer = dismissTimers.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }
    dismissTimers.set(key, timeout)
  }
}

function showMessage(type: MessageType, args: MessageArgs) {
  const { content, duration, key } = normalizeArgs(args)
  const title = content || getDefaultTitle(type)
  const variant = getVariant(type)

  const payload = {
    title,
    variant,
  }

  let handler: ToastHandler

  if (key && activeToasts.has(key)) {
    handler = activeToasts.get(key)!
    handler.update(payload)
  } else {
    handler = toast(payload)
    if (key) {
      activeToasts.set(key, handler)
    }
  }

  const autoDismissSeconds =
    duration !== undefined ? duration : type === "loading" ? undefined : 3
  scheduleDismiss(key, handler, autoDismissSeconds)

  return Promise.resolve()
}

function destroyMessage(key?: string) {
  if (!key) {
    activeToasts.forEach((handler) => handler.dismiss())
    activeToasts.clear()
    dismissTimers.forEach((timer) => clearTimeout(timer))
    dismissTimers.clear()
    return
  }

  const handler = activeToasts.get(key)
  if (handler) {
    handler.dismiss()
    activeToasts.delete(key)
  }
  const timer = dismissTimers.get(key)
  if (timer) {
    clearTimeout(timer)
    dismissTimers.delete(key)
  }
}

export const message = {
  success(args: MessageArgs) {
    return showMessage("success", args)
  },
  error(args: MessageArgs) {
    return showMessage("error", args)
  },
  info(args: MessageArgs) {
    return showMessage("info", args)
  },
  warning(args: MessageArgs) {
    return showMessage("warning", args)
  },
  loading(args: MessageArgs) {
    return showMessage("loading", args)
  },
  destroy: destroyMessage,
}

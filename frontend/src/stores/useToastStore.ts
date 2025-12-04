import { toast } from 'sonner'
import { create } from 'zustand'

type Severity = 'info' | 'success' | 'warning' | 'error'

export type ToastOptions = {
  message: string
  severity?: Severity
  duration?: number
}

type ToastStore = {
  showToast: (options: ToastOptions) => void
}

type ToastHandler = (message: string, options: { duration: number }) => void

const severityMap: Record<Severity, ToastHandler> = {
  info: (message, { duration }) => toast(message, { duration }),
  success: (message, { duration }) => toast.success(message, { duration }),
  warning: (message, { duration }) => toast.warning(message, { duration }),
  error: (message, { duration }) => toast.error(message, { duration }),
}

export const useToastStore = create<ToastStore>(() => ({
  showToast: ({ message, severity = 'info', duration = 4000 }) => {
    severityMap[severity](message, { duration })
  },
}))

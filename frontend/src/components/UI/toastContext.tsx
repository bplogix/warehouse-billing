import { createContext } from 'react'
import type { PropsWithChildren } from 'react'
import { Toaster, toast } from 'sonner'

export type ToastOptions = {
  message: string
  severity?: 'info' | 'success' | 'warning' | 'error'
  duration?: number
}

export type ToastContextValue = {
  showToast: (options: ToastOptions) => void
}

export type ToastItem = ToastOptions & { id: number }

export const ToastContext = createContext<ToastContextValue | null>(null)

export const ToastProvider = ({ children }: PropsWithChildren) => {
  const showToast = ({ message, severity = 'info', duration = 4000 }: ToastOptions) => {
    const map = {
      info: toast,
      success: toast.success,
      warning: toast.warning,
      error: toast.error,
    }
    const handler = map[severity] ?? toast
    handler(message, { duration })
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toaster position="top-center" richColors />
    </ToastContext.Provider>
  )
}

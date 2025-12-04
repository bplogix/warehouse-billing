import type { AlertColor } from '@mui/material'
import { createContext } from 'react'

export type ToastOptions = {
  message: string
  severity?: AlertColor
  duration?: number
}

export type ToastContextValue = {
  showToast: (options: ToastOptions) => void
}

export type ToastItem = ToastOptions & { id: number }

export const ToastContext = createContext<ToastContextValue | null>(null)

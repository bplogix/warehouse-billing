import { Alert, Snackbar } from '@mui/material'
import type { SnackbarCloseReason } from '@mui/material'
import type { PropsWithChildren } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ToastItem, ToastOptions } from './toastContext'
import { ToastContext } from './toastContext'

export const ToastProvider = ({ children }: PropsWithChildren) => {
  const [current, setCurrent] = useState<ToastItem | null>(null)
  const [queue, setQueue] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const showToast = useCallback((options: ToastOptions) => {
    idRef.current += 1
    setQueue((prev) => [
      ...prev,
      {
        id: idRef.current,
        ...options,
      },
    ])
  }, [])

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0])
      setQueue((prev) => prev.slice(1))
    }
  }, [current, queue])

  const handleClose = useCallback(
    (_: Event | React.SyntheticEvent, reason?: SnackbarCloseReason) => {
      if (reason === 'clickaway') {
        return
      }
      setCurrent(null)
    },
    [],
  )

  const contextValue = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <Snackbar
        open={Boolean(current)}
        autoHideDuration={current?.duration ?? 4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          variant="filled"
          severity={current?.severity ?? 'info'}
          onClose={handleClose}
          sx={{ width: '100%' }}
        >
          {current?.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  )
}

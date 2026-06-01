import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import StatusToast from './StatusToast'
import styles from './StatusToast.module.css'

const ToastContext = createContext(null)

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((toastId) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== toastId)
    )
  }, [])

  const addToast = useCallback((toast) => {
    const nextToast = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      duration: 6000,
      type: 'error',
      ...toast,
    }

    setToasts((currentToasts) => [...currentToasts.slice(-2), nextToast])
  }, [])

  const contextValue = useMemo(
    () => ({
      addToast,
      showError: (message, title) => addToast({ type: 'error', message, title }),
      showSuccess: (message, title) =>
        addToast({ type: 'success', message, title }),
      removeToast,
    }),
    [addToast, removeToast]
  )

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className={styles.toastStack} aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <StatusToast key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return context
}

// eslint-disable-next-line react-refresh/only-export-components
export { ToastProvider, useToast }

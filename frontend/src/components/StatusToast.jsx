import { useEffect } from 'react'
import styles from './StatusToast.module.css'

function StatusToast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      onClose(toast.id)
    }, toast.duration ?? 6000)

    return () => window.clearTimeout(timeoutId)
  }, [onClose, toast])

  if (!toast) {
    return null
  }

  const isSuccess = toast.type === 'success'

  return (
    <article
      className={`${styles.toast} ${isSuccess ? styles.successToast : styles.errorToast}`}
      role="alert"
      aria-live="assertive"
    >
      <div className={styles.toastHeader}>
        <p className={styles.toastTitle}>
          {toast.title || (isSuccess ? 'Success' : 'Please check your input')}
        </p>
        <button
          type="button"
          className={styles.closeButton}
          onClick={() => onClose(toast.id)}
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>
      <p className={styles.toastMessage}>{toast.message}</p>
    </article>
  )
}

export default StatusToast

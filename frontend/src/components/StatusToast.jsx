import { useEffect } from 'react'
import styles from './StatusToast.module.css'

function StatusToast({
  message = '',
  onClose,
  title = 'Please check your input',
  duration = 6000,
}) {
  useEffect(() => {
    if (!message || !onClose) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      onClose()
    }, duration)

    return () => window.clearTimeout(timeoutId)
  }, [duration, message, onClose])

  if (!message) {
    return null
  }

  return (
    <div className={styles.toast} role="alert" aria-live="assertive">
      <div className={styles.toastHeader}>
        <p className={styles.toastTitle}>{title}</p>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Dismiss error"
        >
          ×
        </button>
      </div>
      <p className={styles.toastMessage}>{message}</p>
    </div>
  )
}

export default StatusToast

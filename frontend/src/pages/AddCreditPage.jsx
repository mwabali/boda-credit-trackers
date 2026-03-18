import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import CreditForm from '../components/CreditForm'
import { useToast } from '../components/ToastProvider'
import { request } from '../lib/api'
import styles from './AddCreditPage.module.css'

function AddCreditPage() {
  const { user, refreshSession } = useAuth()
  const { showError, showSuccess } = useToast()
  const [riders, setRiders] = useState([])
  const [stations, setStations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadFormOptions() {
      try {
        setIsLoading(true)
        setError('')

        const optionsPayload = await request('/dashboard/form-options')

        setRiders(optionsPayload.data?.riders || [])
        setStations(optionsPayload.data?.stations || [])
      } catch (loadError) {
        setError(loadError.message)
        showError(loadError.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadFormOptions()
  }, [user?.id, showError])

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true)
      setError('')

      const activeUser = await refreshSession()
      if (!activeUser || activeUser.role !== 'rider') {
        throw new Error('Please sign in to your rider account before sending a credit request')
      }

      await request('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          stationId: formData.stationId,
          amount: formData.amount,
          liters: formData.liters,
        }),
      })

      showSuccess('Your fuel credit request has been sent successfully.', 'Request submitted')
    } catch (submitError) {
      setError(submitError.message)
      showError(submitError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Request Fuel Credit</h1>
        <p className={styles.description}>
          Submit a manual fuel credit request and route it to your preferred station for review.
        </p>
      </header>

      <section className={styles.formShell}>
        {isLoading ? <p className={styles.stateMessage}>Loading form options...</p> : null}

        <CreditForm
          riders={riders}
          stations={stations}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel="Submit Request"
          lockedRider={user?.rider || riders[0] || null}
        />
      </section>
    </main>
  )
}

export default AddCreditPage

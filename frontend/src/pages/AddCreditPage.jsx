import { useEffect, useState } from 'react'
import CreditForm from '../components/CreditForm'
import { useToast } from '../components/ToastProvider'
import { request } from '../lib/api'
import styles from './AddCreditPage.module.css'

function AddCreditPage() {
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
  }, [])

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true)
      setError('')

      let riderId = formData.riderId

      if (formData.riderMode === 'new') {
        const riderPayload = await request('/riders', {
          method: 'POST',
          body: JSON.stringify(formData.newRider),
        })

        riderId = riderPayload.data.id
        setRiders((currentRiders) => [riderPayload.data, ...currentRiders])
      }

      await request('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          riderId,
          stationId: formData.stationId,
          amount: formData.amount,
          liters: formData.liters,
        }),
      })

      showSuccess('Credit transaction saved successfully.', 'Transaction saved')
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
        <h1 className={styles.title}>Add Credit Transaction</h1>
        <p className={styles.description}>
          Add a new fuel credit entry for a rider at a specific station.
        </p>
      </header>

      <section className={styles.formShell}>
        {isLoading ? <p className={styles.stateMessage}>Loading form options...</p> : null}

        <CreditForm
          riders={riders}
          stations={stations}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </section>
    </main>
  )
}

export default AddCreditPage

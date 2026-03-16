import { useEffect, useState } from 'react'
import CreditForm from '../components/CreditForm'
import StatusToast from '../components/StatusToast'
import { request } from '../lib/api'
import styles from './AddCreditPage.module.css'

function AddCreditPage() {
  const [riders, setRiders] = useState([])
  const [stations, setStations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

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
      setSuccessMessage('')

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

      setSuccessMessage('Credit transaction saved successfully.')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className={styles.page}>
      <StatusToast message={error} onClose={() => setError('')} />

      <header className={styles.header}>
        <h1 className={styles.title}>Add Credit Transaction</h1>
        <p className={styles.description}>
          Add a new fuel credit entry for a rider at a specific station.
        </p>
      </header>

      <section className={styles.formShell}>
        {isLoading ? <p className={styles.stateMessage}>Loading form options...</p> : null}
        {successMessage ? <p className={styles.successMessage}>{successMessage}</p> : null}

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

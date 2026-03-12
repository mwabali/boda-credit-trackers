import { useState } from 'react'
import styles from './CreditForm.module.css'

const initialValues = {
  riderId: '',
  stationId: '',
  amount: '',
  litres: '',
  number_plate: '',
  phone: '',
}

function CreditForm({
  riders = [],
  stations = [],
  onSubmit,
  submitLabel = 'Save Credit',
  isSubmitting = false,
}) {
  const [formData, setFormData] = useState(initialValues)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target

    if (name === 'riderId') {
      const selectedRider = riders.find((rider) => String(rider.id) === value)

      setFormData((prev) => ({
        ...prev,
        riderId: value,
        number_plate:
          selectedRider?.licensePlate || selectedRider?.number_plate || '',
        phone: selectedRider?.phone || selectedRider?.phone_number || '',
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }

    if (error) setError('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const { riderId, stationId, amount, litres, number_plate, phone } = formData
    if (!riderId || !stationId || !amount || !litres) {
      setError('Rider, station, amount, and litres are required')
      return
    }

    if (typeof onSubmit === 'function') {
      onSubmit({
        riderId: Number(riderId),
        stationId: Number(stationId),
        number_plate,
        phone,
        amount: Number(amount),
        liters: Number(litres),
      })
    }

    setFormData(initialValues)
  }

  return (
    <section className={styles.wrapper} aria-label="Credit entry form">
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field} htmlFor="riderId">
          Rider
          <select
            id="riderId"
            name="riderId"
            value={formData.riderId}
            onChange={handleChange}
          >
            <option value="">Select rider</option>
            {riders.map((rider) => (
              <option key={rider.id} value={rider.id}>
                {rider.name}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field} htmlFor="number_plate">
          Number Plate
          <input
            id="number_plate"
            name="number_plate"
            type="text"
            value={formData.number_plate}
            readOnly
            placeholder="Auto-filled from rider"
          />
        </label>

        <label className={styles.field} htmlFor="phone">
          Phone Number
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            readOnly
            placeholder="Auto-filled from rider"
          />
        </label>

        <label className={styles.field} htmlFor="stationId">
          Station
          <select
            id="stationId"
            name="stationId"
            value={formData.stationId}
            onChange={handleChange}
          >
            <option value="">Select station</option>
            {stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.name}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field} htmlFor="amount">
          Amount
          <input
            id="amount"
            name="amount"
            type="number"
            min="0"
            value={formData.amount}
            onChange={handleChange}
            placeholder="e.g. 1500"
          />
        </label>

        <label className={styles.field} htmlFor="litres">
          Litres
          <input
            id="litres"
            name="litres"
            type="number"
            min="0"
            step="0.1"
            value={formData.litres}
            onChange={handleChange}
            placeholder="e.g. 5"
          />
        </label>

        {error ? <p className={styles.error}>{error}</p> : null}

        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </form>
    </section>
  )
}

export default CreditForm

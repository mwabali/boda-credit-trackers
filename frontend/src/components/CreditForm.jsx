import { getStationDisplayName } from '../lib/mappers'
import { useState } from 'react'
import styles from './CreditForm.module.css'

const initialValues = {
  riderMode: 'existing',
  riderId: '',
  riderName: '',
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
  const hasStations = stations.length > 0

  const handleChange = (event) => {
    const { name, value } = event.target

    if (name === 'riderMode') {
      setFormData((prev) => ({
        ...initialValues,
        riderMode: value,
        stationId: prev.stationId,
        amount: prev.amount,
        litres: prev.litres,
      }))
    } else if (name === 'riderId') {
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

    const {
      riderMode,
      riderId,
      riderName,
      stationId,
      amount,
      litres,
      number_plate,
      phone,
    } = formData

    if (!hasStations) {
      setError('Add at least one station before creating a credit entry')
      return
    }

    if (!stationId || !amount || !litres) {
      setError('Station, amount, and litres are required')
      return
    }

    if (riderMode === 'existing' && !riderId) {
      setError('Please select an existing rider')
      return
    }

    if (riderMode === 'new' && (!riderName || !number_plate || !phone)) {
      setError('New rider name, number plate, and phone are required')
      return
    }

    if (typeof onSubmit === 'function') {
      const payload =
        riderMode === 'existing'
          ? {
              riderMode,
              riderId: Number(riderId),
              number_plate,
              phone,
              stationId: Number(stationId),
              amount: Number(amount),
              liters: Number(litres),
            }
          : {
              riderMode,
              newRider: {
                name: riderName,
                phone,
                licensePlate: number_plate,
              },
              stationId: Number(stationId),
              amount: Number(amount),
              liters: Number(litres),
            }

      onSubmit(payload)
    }

    setFormData(initialValues)
  }

  return (
    <section className={styles.wrapper} aria-label="Credit entry form">
      <form className={styles.form} onSubmit={handleSubmit}>
        {!hasStations ? (
          <p className={styles.alert}>
            No stations are available yet. Add a station first before recording
            credit.
          </p>
        ) : null}

        <fieldset className={styles.modeGroup}>
          <legend>Rider entry</legend>
          <label className={styles.modeOption}>
            <input
              type="radio"
              name="riderMode"
              value="existing"
              checked={formData.riderMode === 'existing'}
              onChange={handleChange}
            />
            Existing rider
          </label>
          <label className={styles.modeOption}>
            <input
              type="radio"
              name="riderMode"
              value="new"
              checked={formData.riderMode === 'new'}
              onChange={handleChange}
            />
            New rider
          </label>
        </fieldset>

        {formData.riderMode === 'existing' ? (
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
        ) : (
          <label className={styles.field} htmlFor="riderName">
            Rider Name
            <input
              id="riderName"
              name="riderName"
              type="text"
              value={formData.riderName}
              onChange={handleChange}
              placeholder="Enter new rider name"
            />
          </label>
        )}

        <label className={styles.field} htmlFor="number_plate">
          Number Plate
          <input
            id="number_plate"
            name="number_plate"
            type="text"
            value={formData.number_plate}
            readOnly={formData.riderMode === 'existing'}
            onChange={handleChange}
            placeholder={
              formData.riderMode === 'existing'
                ? 'Auto-filled from rider'
                : 'Enter rider number plate'
            }
          />
        </label>

        <label className={styles.field} htmlFor="phone">
          Phone Number
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            readOnly={formData.riderMode === 'existing'}
            onChange={handleChange}
            placeholder={
              formData.riderMode === 'existing'
                ? 'Auto-filled from rider'
                : '+254 7xx xxx xxx'
            }
          />
        </label>

        <label className={styles.field} htmlFor="stationId">
          Station
          <select
            id="stationId"
            name="stationId"
            value={formData.stationId}
            onChange={handleChange}
            disabled={!hasStations}
          >
            <option value="">Select station</option>
            {stations.map((station) => (
              <option key={station.id} value={station.id}>
                {getStationDisplayName(station)}
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

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSubmitting || !hasStations}
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </form>
    </section>
  )
}

export default CreditForm

import { useState } from 'react'
import styles from './CreditForm.module.css'

const initialValues = {
  rider: '',
  station: '',
  amount: '',
  litres: '',
}

function CreditForm({ riders = [], stations = [], onSubmit }) {
  const [formData, setFormData] = useState(initialValues)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const { rider, station, amount, litres } = formData
    if (!rider || !station || !amount || !litres) {
      setError('All fields are required')
      return
    }

    if (typeof onSubmit === 'function') {
      onSubmit({
        rider,
        station,
        amount: Number(amount),
        litres: Number(litres),
      })
    }

    setFormData(initialValues)
  }

  return (
    <section className={styles.wrapper} aria-label="Credit entry form">
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field} htmlFor="rider">
          Rider
          <input
            id="rider"
            name="rider"
            type="text"
            value={formData.rider}
            onChange={handleChange}
            placeholder="Enter rider name or ID"
            list="riderList"
          />
          <datalist id="riderList">
            {riders.map((rider) => (
              <option key={rider.id} value={rider.name} />
            ))}
          </datalist>
        </label>

        <label className={styles.field} htmlFor="station">
          Station
          <select
            id="station"
            name="station"
            value={formData.station}
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

        <button type="submit" className={styles.submitButton}>
          Save Credit
        </button>
      </form>
    </section>
  )
}

export default CreditForm


import { useEffect, useMemo, useState } from 'react'
import StationList from '../components/StationList'
import { request } from '../lib/api'
import styles from './StationsPage.module.css'

const initialStationValues = {
  name: '',
  location: '',
  managerName: '',
  managerPhone: '',
}

function formatStationId(id) {
  return `FS${String(id).padStart(3, '0')}`
}

function StationsPage() {
  const [stations, setStations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [formValues, setFormValues] = useState(initialStationValues)

  useEffect(() => {
    async function loadStations() {
      try {
        setIsLoading(true)
        setError('')
        const payload = await request('/stations')
        setStations(payload.data || [])
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadStations()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
    if (error) setError('')
    if (successMessage) setSuccessMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setIsSubmitting(true)
      setError('')
      setSuccessMessage('')

      const payload = await request('/stations', {
        method: 'POST',
        body: JSON.stringify(formValues),
      })

      setStations((prev) => [payload.data, ...prev])
      setFormValues(initialStationValues)
      setSuccessMessage('Station added successfully.')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const activeStations = useMemo(
    () => stations.filter((station) => station.status === 'active').length,
    [stations]
  )

  const stationsWithManagers = useMemo(
    () => stations.filter((station) => station.managerName).length,
    [stations]
  )

  const stationListRows = useMemo(
    () =>
      stations.map((station) => ({
        ...station,
        phone: station.managerPhone || '--',
      })),
    [stations]
  )

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Fuel Stations Network</h1>
        <p className={styles.description}>
          Live station directory backed by the current backend station records.
        </p>
      </header>

      <section className={styles.statsGrid} aria-label="Station summary">
        <article className={styles.statCard}>
          <h2>Total Stations</h2>
          <p>{stations.length}</p>
        </article>
        <article className={styles.statCard}>
          <h2>Active Stations</h2>
          <p>{activeStations}</p>
        </article>
        <article className={styles.statCard}>
          <h2>Manager Contacts</h2>
          <p>{stationsWithManagers}</p>
        </article>
      </section>

      <section className={styles.formSection} aria-label="Add station">
        <div className={styles.formIntro}>
          <h2 className={styles.formTitle}>Add a Station</h2>
          <p className={styles.formDescription}>
            Create a station here so it becomes available immediately in the Add
            Credit form.
          </p>
        </div>

        {error ? <p className={styles.errorMessage}>{error}</p> : null}
        {successMessage ? <p className={styles.successMessage}>{successMessage}</p> : null}

        <form className={styles.stationForm} onSubmit={handleSubmit}>
          <label className={styles.field}>
            Station Name
            <input
              type="text"
              name="name"
              value={formValues.name}
              onChange={handleChange}
              placeholder="e.g. City Centre Petro"
              required
            />
          </label>

          <label className={styles.field}>
            Location
            <input
              type="text"
              name="location"
              value={formValues.location}
              onChange={handleChange}
              placeholder="e.g. Nairobi CBD"
              required
            />
          </label>

          <label className={styles.field}>
            Manager Name
            <input
              type="text"
              name="managerName"
              value={formValues.managerName}
              onChange={handleChange}
              placeholder="Optional"
            />
          </label>

          <label className={styles.field}>
            Manager Phone
            <input
              type="tel"
              name="managerPhone"
              value={formValues.managerPhone}
              onChange={handleChange}
              placeholder="+254 7xx xxx xxx"
            />
          </label>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Add Station'}
          </button>
        </form>
      </section>

      <section className={styles.cardsGrid} aria-label="Station cards">
        {isLoading ? <p className={styles.stateMessage}>Loading stations...</p> : null}
        {error ? <p className={styles.errorMessage}>{error}</p> : null}

        {!isLoading && !error && !stations.length ? (
          <p className={styles.stateMessage}>No stations available.</p>
        ) : null}

        {!isLoading && !error
          ? stations.map((station) => (
              <article key={station.id} className={styles.stationCard}>
                <h2>
                  {formatStationId(station.id)} <span>{station.name}</span>
                </h2>
                <ul>
                  <li>
                    <strong>Location:</strong> {station.location}
                  </li>
                  <li>
                    <strong>Manager:</strong> {station.managerName || 'Not assigned'}
                  </li>
                  <li>
                    <strong>Phone:</strong> {station.managerPhone || '--'}
                  </li>
                </ul>
              </article>
            ))
          : null}
      </section>

      <div className={styles.listSection}>
        <div>
          <h2 className={styles.listHeading}>Station directory</h2>
          <p className={styles.listDescription}>
            Track the active stations in a tabular view for quick reference.
          </p>
        </div>
        <StationList stations={stationListRows} />
      </div>
    </main>
  )
}

export default StationsPage

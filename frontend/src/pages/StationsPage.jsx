import { useEffect, useMemo, useState } from 'react'
import StationList from '../components/StationList'
import { request } from '../lib/api'
import styles from './StationsPage.module.css'

function formatStationId(id) {
  return `FS${String(id).padStart(3, '0')}`
}

function StationsPage() {
  const [stations, setStations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

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

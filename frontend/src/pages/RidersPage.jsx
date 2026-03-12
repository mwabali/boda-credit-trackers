import { useEffect, useMemo, useState } from 'react'
import { request } from '../lib/api'
import { formatCurrency, formatStatus } from '../lib/formatters'
import styles from './RidersPage.module.css'

function formatRiderId(id) {
  return `R${String(id).padStart(3, '0')}`
}

function RidersPage() {
  const [riders, setRiders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadRiders() {
      try {
        setIsLoading(true)
        setError('')
        const payload = await request('/riders')
        setRiders(payload.data || [])
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadRiders()
  }, [])

  const riderRows = useMemo(
    () =>
      riders.map((rider) => ({
        id: formatRiderId(rider.id),
        name: rider.name,
        plate: rider.licensePlate,
        phone: rider.phone,
        debt: formatCurrency(rider.currentBalance),
        status: formatStatus(rider.status),
      })),
    [riders]
  )

  const totalDebt = useMemo(
    () => riders.reduce((sum, rider) => sum + Number(rider.currentBalance || 0), 0),
    [riders]
  )

  const activeRiders = useMemo(
    () => riders.filter((rider) => rider.status === 'active').length,
    [riders]
  )

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Riders Management</h1>
        <p className={styles.description}>
          Live rider registry view backed by the current backend rider records.
        </p>
      </header>

      <section className={styles.statsGrid} aria-label="Riders summary">
        <article className={styles.statCard}>
          <h2>Total Riders</h2>
          <p>{riders.length}</p>
        </article>
        <article className={styles.statCard}>
          <h2>Active Riders</h2>
          <p>{activeRiders}</p>
        </article>
        <article className={styles.statCard}>
          <h2>Total Debt (Overall)</h2>
          <p>{formatCurrency(totalDebt)}</p>
        </article>
      </section>

      <section className={styles.tableShell} aria-label="Riders list">
        {isLoading ? <p className={styles.stateMessage}>Loading riders...</p> : null}
        {error ? <p className={styles.errorMessage}>{error}</p> : null}

        {!isLoading && !error && !riderRows.length ? (
          <p className={styles.stateMessage}>No riders available.</p>
        ) : null}

        {!isLoading && !error && riderRows.length ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Number Plate</th>
                <th>Phone</th>
                <th>Debt</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {riderRows.map((rider) => (
                <tr key={rider.id}>
                  <td>{rider.id}</td>
                  <td>{rider.name}</td>
                  <td>{rider.plate}</td>
                  <td>{rider.phone}</td>
                  <td>{rider.debt}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[rider.status.toLowerCase()]}`}>
                      {rider.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </main>
  )
}

export default RidersPage

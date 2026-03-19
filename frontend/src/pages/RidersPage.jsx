import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import ridersIcon from '../assets/Riders_icon.svg'
import { useToast } from '../components/ToastProvider'
import { request } from '../lib/api'
import { formatCurrency, formatStatus } from '../lib/formatters'
import styles from './RidersPage.module.css'

function formatRiderId(id) {
  return `R${String(id).padStart(3, '0')}`
}

function RidersPage() {
  const { user } = useAuth()
  const { showError, showSuccess } = useToast()
  const [riders, setRiders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [error, setError] = useState('')

  const loadRiders = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')
      const payload = await request('/riders')
      setRiders(payload.data || [])
    } catch (loadError) {
      setError(loadError.message)
      showError(loadError.message)
    } finally {
      setIsLoading(false)
    }
  }, [showError])

  useEffect(() => {
    loadRiders()
  }, [loadRiders])

  const riderRows = useMemo(
    () =>
      riders.map((rider) => ({
        id: formatRiderId(rider.id),
        name: rider.name,
        plate: rider.licensePlate,
        phone: rider.phone,
        debt: formatCurrency(rider.currentBalance),
        status: formatStatus(rider.status),
        statusValue: rider.status,
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

  const handleStatusChange = async (riderId, status) => {
    try {
      setIsUpdatingStatus(true)
      setError('')

      await request(`/riders/${riderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })

      showSuccess('Rider status updated successfully.', 'Status updated')
      await loadRiders()
    } catch (updateError) {
      setError(updateError.message)
      showError(updateError.message)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const canManageRiders = user?.role === 'station'

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          {user?.role === 'station' ? 'Rider Oversight' : 'Riders Management'}
        </h1>
        <p className={styles.description}>
          {user?.role === 'station'
            ? 'Monitor rider standing and control access when needed.'
            : 'View riders currently interacting with your company fuel credit service.'}
        </p>
      </header>

      <section className={styles.statsGrid} aria-label="Riders summary">
        <article className={styles.statCard}>
          <h2>{user?.role === 'station' ? 'Riders in Scope' : 'Total Riders'}</h2>
          <div className={styles.metricRow}>
            <img
              src={ridersIcon}
              alt=""
              aria-hidden="true"
              className={`${styles.metricIcon} ${styles.totalIcon}`}
            />
            <p className={styles.statValue}>{riders.length}</p>
          </div>
          <span className={styles.statMeta}>
            {user?.role === 'station'
              ? 'riders linked to your station'
              : 'registered rider profiles'}
          </span>
        </article>
        <article className={styles.statCard}>
          <h2>{user?.role === 'station' ? 'Clear to Fuel' : 'Active Riders'}</h2>
          <div className={styles.metricRow}>
            <img
              src={ridersIcon}
              alt=""
              aria-hidden="true"
              className={`${styles.metricIcon} ${styles.activeIcon}`}
            />
            <p className={styles.statValue}>{activeRiders}</p>
          </div>
          <span className={styles.statMeta}>
            {user?.role === 'station'
              ? 'accounts currently clear to request'
              : 'currently active riders'}
          </span>
        </article>
        <article className={`${styles.statCard} ${styles.statCardWide}`}>
          <h2>{user?.role === 'station' ? 'Outstanding Rider Exposure' : 'Total Debt (Overall)'}</h2>
          <div className={styles.metricRow}>
            <img
              src={ridersIcon}
              alt=""
              aria-hidden="true"
              className={`${styles.metricIcon} ${styles.debtIcon}`}
            />
            <p className={styles.statValue}>{formatCurrency(totalDebt)}</p>
          </div>
          <span className={styles.statMeta}>
            {user?.role === 'station'
              ? 'open rider balances at your station'
              : 'outstanding rider balances'}
          </span>
        </article>
      </section>

      <section className={styles.tableShell} aria-label="Riders list">
        {isLoading ? <p className={styles.stateMessage}>Loading riders...</p> : null}
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
                <th>{user?.role === 'station' ? 'Exposure' : 'Debt'}</th>
                <th>{user?.role === 'station' ? 'Access Control' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {riderRows.map((rider) => (
                <tr key={rider.id}>
                  <td>{rider.id}</td>
                  <td>
                    <span className={styles.nameCell}>
                      <span
                        className={`${styles.statusDot} ${styles[`${rider.statusValue}Dot`]}`}
                        aria-hidden="true"
                      />
                      <span>{rider.name}</span>
                    </span>
                  </td>
                  <td>{rider.plate}</td>
                  <td>{rider.phone}</td>
                  <td>{rider.debt}</td>
                  <td>
                    {canManageRiders ? (
                      <select
                        className={`${styles.statusSelect} ${styles[rider.statusValue]}`}
                        value={rider.statusValue}
                        onChange={(event) =>
                          handleStatusChange(Number(rider.id.slice(1)), event.target.value)
                        }
                        disabled={isUpdatingStatus}
                        aria-label={`Update ${rider.name} status`}
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    ) : (
                      <span className={`${styles.statusBadge} ${styles[rider.statusValue]}`}>
                        {rider.status}
                      </span>
                    )}
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

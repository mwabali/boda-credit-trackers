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
  const [companyFocus, setCompanyFocus] = useState('exposure')
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

  const watchlistRiders = useMemo(
    () => riders.filter((rider) => rider.status === 'suspended' || rider.status === 'inactive').length,
    [riders]
  )

  const averageExposure = useMemo(
    () => (riders.length ? totalDebt / riders.length : 0),
    [riders.length, totalDebt]
  )

  const highestExposure = useMemo(
    () => riders.reduce((max, rider) => Math.max(max, Number(rider.currentBalance || 0)), 0),
    [riders]
  )

  const riderFocusSummary = useMemo(() => {
    switch (companyFocus) {
      case 'standing':
        return {
          label: 'Access standing',
          description: 'Highlights riders who may need attention before they create friction in the service.',
        }
      case 'recency':
        return {
          label: 'Recently updated riders',
          description: 'Tracks which rider records have changed most recently across your company footprint.',
        }
      case 'exposure':
      default:
        return {
          label: 'Highest rider exposure',
          description: 'Ranks riders by open balance so you can quickly see where portfolio risk is concentrated.',
        }
    }
  }, [companyFocus])

  const companyFocusRows = useMemo(() => {
    if (companyFocus === 'standing') {
      const priority = { suspended: 0, inactive: 1, active: 2 }
      return [...riders]
        .sort((left, right) => {
          const priorityDelta = (priority[left.status] ?? 3) - (priority[right.status] ?? 3)
          if (priorityDelta !== 0) {
            return priorityDelta
          }

          return Number(right.currentBalance || 0) - Number(left.currentBalance || 0)
        })
        .slice(0, 3)
        .map((rider) => ({
          id: rider.id,
          name: rider.name,
          subtitle: formatStatus(rider.status),
          value: formatCurrency(rider.currentBalance),
          meter: rider.status === 'suspended' ? 100 : rider.status === 'inactive' ? 60 : 25,
        }))
    }

    if (companyFocus === 'recency') {
      return [...riders]
        .sort((left, right) => {
          const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime()
          const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime()
          return rightTime - leftTime
        })
        .slice(0, 3)
        .map((rider) => {
          const timestamp = new Date(rider.updatedAt || rider.createdAt || 0)
          return {
            id: rider.id,
            name: rider.name,
            subtitle: rider.licensePlate,
            value: Number.isNaN(timestamp.getTime())
              ? 'No timestamp'
              : timestamp.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                }),
            meter: 100,
          }
        })
    }

    const maxExposure = riders.reduce(
      (max, rider) => Math.max(max, Number(rider.currentBalance || 0)),
      0
    )

    return [...riders]
      .sort((left, right) => Number(right.currentBalance || 0) - Number(left.currentBalance || 0))
      .slice(0, 3)
      .map((rider) => {
        const exposure = Number(rider.currentBalance || 0)
        return {
          id: rider.id,
          name: rider.name,
          subtitle: rider.licensePlate,
          value: formatCurrency(exposure),
          meter: maxExposure ? Math.max(12, Math.round((exposure / maxExposure) * 100)) : 12,
        }
      })
  }, [companyFocus, riders])

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
          {user?.role === 'station' ? 'Rider Oversight' : 'Rider Portfolio'}
        </h1>
        <p className={styles.description}>
          {user?.role === 'station'
            ? 'Monitor rider standing and control access when needed.'
            : 'Track rider health, exposure, and access quality across your company service.'}
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

      {user?.role === 'company' ? (
        <section className={styles.analyticsGrid} aria-label="Rider analytics">
          <article className={styles.insightPanel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelEyebrow}>Rider health</p>
                <h2 className={styles.panelTitle}>Portfolio posture</h2>
              </div>
              <span className={styles.panelBadge}>{riders.length} riders</span>
            </div>

            <div className={styles.panelStatsGrid}>
              <div className={styles.panelStat}>
                <span>Clear to fuel</span>
                <strong>{riders.length ? `${Math.round((activeRiders / riders.length) * 100)}%` : '0%'}</strong>
              </div>
              <div className={styles.panelStat}>
                <span>Watchlist riders</span>
                <strong>{watchlistRiders}</strong>
              </div>
              <div className={styles.panelStat}>
                <span>Avg exposure</span>
                <strong>{formatCurrency(averageExposure)}</strong>
              </div>
              <div className={styles.panelStat}>
                <span>Peak exposure</span>
                <strong>{formatCurrency(highestExposure)}</strong>
              </div>
            </div>
          </article>

          <article className={styles.insightPanel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelEyebrow}>Live view</p>
                <h2 className={styles.panelTitle}>Rider signals</h2>
              </div>
            </div>

            <div className={styles.toggleRow} role="tablist" aria-label="Rider analytics focus">
              {[
                ['exposure', 'Exposure'],
                ['standing', 'Standing'],
                ['recency', 'Recency'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={companyFocus === value ? styles.toggleActive : styles.toggleButton}
                  onClick={() => setCompanyFocus(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className={styles.focusSummary}>
              <div>
                <p className={styles.focusEyebrow}>Now tracking</p>
                <h3 className={styles.focusTitle}>{riderFocusSummary.label}</h3>
                <p className={styles.focusDescription}>{riderFocusSummary.description}</p>
              </div>
            </div>

            <div className={styles.focusList}>
              {companyFocusRows.length ? (
                companyFocusRows.map((row) => (
                  <article key={`${companyFocus}-${row.id}`} className={styles.focusRow}>
                    <div className={styles.focusRowHeader}>
                      <div>
                        <h4>{row.name}</h4>
                        <p>{row.subtitle}</p>
                      </div>
                      <strong>{row.value}</strong>
                    </div>
                    <div className={styles.meterTrack}>
                      <span className={styles.meterFill} style={{ width: `${row.meter}%` }} />
                    </div>
                  </article>
                ))
              ) : (
                <p className={styles.stateMessage}>No rider analytics available yet.</p>
              )}
            </div>
          </article>
        </section>
      ) : null}

      {user?.role !== 'company' ? (
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
      ) : null}
    </main>
  )
}

export default RidersPage

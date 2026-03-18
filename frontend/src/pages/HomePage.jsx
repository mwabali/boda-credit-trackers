import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import CreditForm from '../components/CreditForm'
import CreditTable from '../components/CreditTable'
import StationList from '../components/StationList'
import { useToast } from '../components/ToastProvider'
import ridersIcon from '../assets/Riders_icon.svg'
import stationsIcon from '../assets/Stations_icon.svg'
import transactionsIcon from '../assets/Transactions_icon.svg'
import { formatCurrency } from '../lib/formatters'
import { request } from '../lib/api'
import { mapTransactionToRow } from '../lib/mappers'
import styles from './HomePage.module.css'

const dashboardSections = [
  {
    title: 'Riders',
    description: 'Review rider portfolio health and watch credit exposure trends.',
    to: '/riders',
    icon: ridersIcon,
    iconClassName: styles.ridersCardIcon,
  },
  {
    title: 'Fuel Stations',
    description: 'Compare stations, spot underperformance, and enroll new locations.',
    to: '/stations',
    icon: stationsIcon,
    iconClassName: styles.stationsCardIcon,
  },
  {
    title: 'Transactions',
    description: 'Track company-wide request flow, approvals, and settlement signals.',
    to: '/transactions',
    icon: transactionsIcon,
    iconClassName: styles.transactionsCardIcon,
  },
]

function HomePage() {
  const { user } = useAuth()
  const { showError, showSuccess } = useToast()
  const companyLabel =
    user?.role !== 'rider' && user?.companyName ? `.${user.companyName}` : ''
  const [riders, setRiders] = useState([])
  const [stations, setStations] = useState([])
  const [transactions, setTransactions] = useState([])
  const [stats, setStats] = useState({ total: 0, pending: 0, paid: 0 })
  const [analytics, setAnalytics] = useState({
    totalAmount: 0,
    paidAmount: 0,
    outstandingAmount: 0,
    approvalRate: 0,
    settlementRate: 0,
    activeStations: 0,
    suspendedRiders: 0,
    inactiveRiders: 0,
    stationPerformance: [],
  })
  const [comparisonMetric, setComparisonMetric] = useState('totalAmount')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')

      const dashboardPayload = await request('/dashboard')

      setRiders(dashboardPayload.data?.riders || [])
      setStations(dashboardPayload.data?.stations || [])
      setTransactions(dashboardPayload.data?.transactions || [])
      setStats(dashboardPayload.data?.stats || { total: 0, pending: 0, paid: 0 })
      setAnalytics(
        dashboardPayload.data?.analytics || {
          totalAmount: 0,
          paidAmount: 0,
          outstandingAmount: 0,
          approvalRate: 0,
          settlementRate: 0,
          activeStations: 0,
          suspendedRiders: 0,
          inactiveRiders: 0,
          stationPerformance: [],
        }
      )
    } catch (loadError) {
      setError(loadError.message)
      showError(loadError.message)
    } finally {
      setIsLoading(false)
    }
  }, [showError])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const stationListRows = useMemo(
    () =>
      stations.slice(0, 10).map((station) => ({
        ...station,
        phone: station.managerPhone || '--',
      })),
    [stations]
  )

  const tableTransactions = useMemo(
    () => transactions.slice(0, 5).map(mapTransactionToRow),
    [transactions]
  )

  const handleQuickCredit = async (formData) => {
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

      showSuccess('Dashboard credit entry saved successfully.', 'Transaction saved')
      await loadDashboardData()
    } catch (submitError) {
      setError(submitError.message)
      showError(submitError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const role = user?.role || 'company'
  const primaryRider = riders[0]
  const primaryStation = stations[0]

  const heroConfig = useMemo(() => {
    if (role === 'station') {
      return {
        title: 'Station Dashboard',
        companyMark: companyLabel,
        description:
          'Track your station performance, review rider credit activity, and resolve branch-level issues.',
      }
    }

    if (role === 'rider') {
      return {
        title: 'Rider Dashboard',
        companyMark: '',
        description:
          'Request fuel credit, track your balance, and review recent activity from your phone.',
      }
    }

    return {
      title: 'Company Dashboard',
      companyMark: companyLabel,
      description:
        'Monitor service health, compare station performance, and keep a clear view of credit exposure across your company footprint.',
    }
  }, [companyLabel, role])

  const statCards = useMemo(() => {
    if (role === 'station') {
      return [
        {
          title: 'Riders Served',
          value: riders.length,
          meta: 'riders linked to this station',
          icon: ridersIcon,
          iconClassName: styles.ridersIcon,
        },
        {
          title: 'Station Transactions',
          value: stats.total,
          meta: 'credit entries logged here',
          icon: transactionsIcon,
          iconClassName: styles.transactionsIcon,
        },
        {
          title: 'Pending Payments',
          value: stats.pending,
          meta: 'transactions awaiting settlement',
          icon: transactionsIcon,
          iconClassName: styles.transactionsIcon,
          wide: true,
        },
      ]
    }

    if (role === 'rider') {
      return [
        {
          title: 'Outstanding Balance',
          value: formatCurrency(primaryRider?.currentBalance || 0),
          meta: 'current credit balance',
          icon: transactionsIcon,
          iconClassName: styles.transactionsIcon,
        },
        {
          title: 'Credit Activity',
          value: stats.total,
          meta: 'transactions on your account',
          icon: transactionsIcon,
          iconClassName: styles.transactionsIcon,
        },
        {
          title: 'Pending Payments',
          value: stats.pending,
          meta: 'unsettled entries on your profile',
          icon: transactionsIcon,
          iconClassName: styles.transactionsIcon,
          wide: true,
        },
      ]
    }

    return [
      {
        title: 'Enrolled Stations',
        value: stations.length,
        meta: `${analytics.activeStations || 0} currently active`,
        accent: 'stations',
      },
      {
        title: 'Outstanding Exposure',
        value: formatCurrency(analytics.outstandingAmount || 0),
        meta: `${stats.pending} unsettled requests`,
        accent: 'exposure',
      },
      {
        title: 'Approval Rate',
        value: `${analytics.approvalRate || 0}%`,
        meta: 'approved or paid requests',
        accent: 'approval',
      },
      {
        title: 'Service Recovery',
        value: `${analytics.settlementRate || 0}%`,
        meta: `${analytics.suspendedRiders || 0} riders suspended`,
        accent: 'recovery',
      },
    ]
  }, [
    analytics.activeStations,
    analytics.approvalRate,
    analytics.outstandingAmount,
    analytics.settlementRate,
    analytics.suspendedRiders,
    primaryRider?.currentBalance,
    riders.length,
    role,
    stations.length,
    stats.pending,
    stats.total,
  ])

  const showQuickCredit = role === 'rider'
  const showStationDirectory = role === 'company'
  const showNavCards = role === 'company'

  const companyComparisonRows = useMemo(() => {
    const rows = [...(analytics.stationPerformance || [])]
    rows.sort(
      (left, right) => Number(right[comparisonMetric] || 0) - Number(left[comparisonMetric] || 0)
    )
    return rows.slice(0, 5)
  }, [analytics.stationPerformance, comparisonMetric])

  const comparisonConfig = useMemo(() => {
    if (comparisonMetric === 'outstandingAmount') {
      return {
        title: 'Outstanding exposure',
        description: 'Shows which stations are carrying the largest unsettled credit position.',
        formatValue: (value) => formatCurrency(value),
      }
    }

    if (comparisonMetric === 'approvalRate') {
      return {
        title: 'Approval conversion',
        description: 'Shows how effectively each station is converting requests into approved or paid outcomes.',
        formatValue: (value) => `${Math.round(value)}%`,
      }
    }

    return {
      title: 'Credit volume',
      description: 'Shows the total value of credit requests processed by each station.',
      formatValue: (value) => formatCurrency(value),
    }
  }, [comparisonMetric])

  const comparisonLeader = companyComparisonRows[0] || null

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroTop}>
          <h1 className={styles.title}>{heroConfig.title}</h1>
          {heroConfig.companyMark ? (
            <span className={styles.companyMark}>{heroConfig.companyMark}</span>
          ) : null}
        </div>
        <p className={styles.description}>{heroConfig.description}</p>
      </header>

      {isLoading ? <p className={styles.feedbackMessage}>Loading dashboard data...</p> : null}

      <section
        className={`${styles.statsGrid} ${role === 'company' ? styles.companyStatsGrid : ''}`}
        aria-label="Dashboard highlights"
      >
        {statCards.map((card) => (
          <article
            key={card.title}
            className={`${styles.statCard} ${card.wide ? styles.statCardWide : ''} ${
              role === 'company' ? styles.companyStatCard : ''
            } ${card.accent ? styles[`accent${card.accent[0].toUpperCase()}${card.accent.slice(1)}`] : ''}`}
          >
            <h2>{card.title}</h2>
            <div className={styles.metricRow}>
              {card.icon ? (
                <img
                  src={card.icon}
                  alt=""
                  aria-hidden="true"
                  className={`${styles.metricIcon} ${card.iconClassName}`}
                />
              ) : null}
              <p className={styles.statValue}>{card.value}</p>
            </div>
            <span className={styles.statMeta}>{card.meta}</span>
          </article>
        ))}
      </section>

      {role === 'company' ? (
        <section className={styles.companyInsightGrid} aria-label="Company insights">
          <article className={styles.extensionCard}>
            <div className={styles.sectionHeader}>
              <p className={styles.sectionTag}>Service health</p>
              <h2>Portfolio health snapshot</h2>
              <p>Focus on throughput, recovery, and rider risk across the stations enrolled under your company.</p>
            </div>

            <div className={styles.healthGrid}>
              <div className={styles.healthItem}>
                <span className={styles.healthLabel}>Total issued</span>
                <strong>{formatCurrency(analytics.totalAmount || 0)}</strong>
              </div>
              <div className={styles.healthItem}>
                <span className={styles.healthLabel}>Recovered value</span>
                <strong>{formatCurrency(analytics.paidAmount || 0)}</strong>
              </div>
              <div className={styles.healthItem}>
                <span className={styles.healthLabel}>Suspended riders</span>
                <strong>{analytics.suspendedRiders || 0}</strong>
              </div>
              <div className={styles.healthItem}>
                <span className={styles.healthLabel}>Inactive riders</span>
                <strong>{analytics.inactiveRiders || 0}</strong>
              </div>
            </div>
          </article>

          <article className={styles.extensionCard}>
            <div className={styles.sectionHeader}>
              <p className={styles.sectionTag}>Station comparison</p>
              <h2>Compare company stations</h2>
              <p>Use the toggles to compare station volume, outstanding exposure, and approval conversion.</p>
            </div>

            <div className={styles.toggleRow}>
              <button
                type="button"
                className={comparisonMetric === 'totalAmount' ? styles.toggleActive : styles.toggleButton}
                onClick={() => setComparisonMetric('totalAmount')}
              >
                Volume
              </button>
              <button
                type="button"
                className={comparisonMetric === 'outstandingAmount' ? styles.toggleActive : styles.toggleButton}
                onClick={() => setComparisonMetric('outstandingAmount')}
              >
                Exposure
              </button>
              <button
                type="button"
                className={comparisonMetric === 'approvalRate' ? styles.toggleActive : styles.toggleButton}
                onClick={() => setComparisonMetric('approvalRate')}
              >
                Approval
              </button>
            </div>

            <div className={styles.comparisonSummary}>
              <div>
                <p className={styles.comparisonEyebrow}>Now comparing</p>
                <h3>{comparisonConfig.title}</h3>
                <p>{comparisonConfig.description}</p>
              </div>
              {comparisonLeader ? (
                <div className={styles.comparisonSpotlight}>
                  <span className={styles.comparisonEyebrow}>Leading station</span>
                  <strong>{comparisonLeader.displayName}</strong>
                  <span>
                    {comparisonConfig.formatValue(
                      Number(comparisonLeader[comparisonMetric] || 0)
                    )}
                  </span>
                </div>
              ) : null}
            </div>

            {companyComparisonRows.length > 0 ? (
              <div className={styles.leaderboard}>
                {companyComparisonRows.map((station) => {
                  const maxValue = Math.max(
                    ...companyComparisonRows.map((item) => Number(item[comparisonMetric] || 0)),
                    1
                  )
                  const currentValue = Number(station[comparisonMetric] || 0)
                  const width = `${Math.max(10, (currentValue / maxValue) * 100)}%`

                  return (
                    <div key={station.id} className={styles.leaderRow}>
                      <div className={styles.leaderMeta}>
                        <strong>{station.displayName}</strong>
                        <span>
                          {station.totalTransactions} transactions • {station.activeRiders} riders
                        </span>
                      </div>
                      <div className={styles.leaderBarTrack}>
                        <span className={styles.leaderBarFill} style={{ width }} />
                      </div>
                      <strong className={styles.leaderValue}>
                        {comparisonConfig.formatValue(currentValue)}
                      </strong>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className={styles.comparisonEmptyState}>
                <h3>No station comparison data yet</h3>
                <p>
                  Once your stations start processing rider requests, this view will rank them by
                  {` ${comparisonConfig.title.toLowerCase()}`}.
                </p>
              </div>
            )}
          </article>
        </section>
      ) : null}

      {showQuickCredit || showStationDirectory ? (
        <section className={styles.extensionGrid} aria-label="Quick entries">
          {showQuickCredit ? (
            <article className={styles.extensionCard}>
              <div className={styles.sectionHeader}>
                <p className={styles.sectionTag}>Live form preview</p>
                <h2>Fuel credit request</h2>
                <p>
                  Submit a fuel credit request to your chosen station using your rider account details.
                </p>
              </div>
              <CreditForm
                riders={riders}
                stations={stations}
                onSubmit={handleQuickCredit}
                submitLabel="Submit Request"
                isSubmitting={isSubmitting}
                lockedRider={user?.rider || primaryRider || null}
              />
            </article>
          ) : null}

          {showStationDirectory ? (
            <article className={styles.extensionCard}>
              <div className={styles.sectionHeader}>
                <p className={styles.sectionTag}>Company network</p>
                <h2>Station directory</h2>
                <p>
                  Reference the enrolled stations under your company without leaving the dashboard.
                </p>
              </div>
              <StationList stations={stationListRows} />
            </article>
          ) : null}
        </section>
      ) : null}

      {role === 'rider' && primaryRider ? (
        <section className={styles.extensionGrid} aria-label="Account snapshot">
          <article className={styles.extensionCard}>
            <div className={styles.sectionHeader}>
              <p className={styles.sectionTag}>Your profile</p>
              <h2>{primaryRider.name}</h2>
              <p>
                Plate {primaryRider.licensePlate} • Phone {primaryRider.phone}
              </p>
            </div>
          </article>
          {primaryStation ? (
            <article className={styles.extensionCard}>
              <div className={styles.sectionHeader}>
                <p className={styles.sectionTag}>Recent station</p>
                <h2>{primaryStation.displayName}</h2>
                <p>{primaryStation.location}</p>
              </div>
            </article>
          ) : null}
        </section>
      ) : null}

      {showNavCards ? (
        <section className={styles.cardGrid} aria-label="Company navigation">
          {dashboardSections.map((section) => (
            <article key={section.to} className={styles.navCard}>
              <img src={section.icon} alt="" aria-hidden="true" className={`${styles.navCardIcon} ${section.iconClassName}`} />
              <h2>{section.title}</h2>
              <p>{section.description}</p>
              <Link to={section.to} className={styles.cardLink}>
                Open section
              </Link>
            </article>
          ))}
        </section>
      ) : null}

      <section className={styles.tableSection}>
        <div className={styles.sectionHeader}>
          <p className={styles.sectionTag}>Recent activity</p>
          <h2>Credit transactions</h2>
          <p>
            The same live transaction feed that powers the Transactions page is surfaced here for quick review.
          </p>
        </div>
        <CreditTable transactions={tableTransactions} showPhone={false} />
      </section>

      {error ? <p className={styles.errorMessage}>{error}</p> : null}
    </main>
  )
}

export default HomePage

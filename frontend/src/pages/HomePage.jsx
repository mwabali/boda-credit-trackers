import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import CreditForm from '../components/CreditForm'
import CreditTable from '../components/CreditTable'
import StationList from '../components/StationList'
import { useToast } from '../components/ToastProvider'
import ridersIcon from '../assets/Riders_icon.svg'
import stationsIcon from '../assets/Stations_icon.svg'
import transactionsIcon from '../assets/Transactions_icon.svg'
import { request } from '../lib/api'
import { mapTransactionToRow } from '../lib/mappers'
import styles from './HomePage.module.css'

const dashboardSections = [
  {
    title: 'Riders',
    description: 'Manage rider profiles, debt status, and activity tracking.',
    to: '/riders',
    icon: ridersIcon,
    iconClassName: styles.ridersCardIcon,
  },
  {
    title: 'Fuel Stations',
    description: 'Organize station records and monitor station credit balances.',
    to: '/stations',
    icon: stationsIcon,
    iconClassName: styles.stationsCardIcon,
  },
  {
    title: 'Transactions',
    description: 'Review credit transactions and reconcile outstanding balances.',
    to: '/transactions',
    icon: transactionsIcon,
    iconClassName: styles.transactionsCardIcon,
  },
  {
    title: 'Add Credit',
    description: 'Prepare manual credit entries before API integration begins.',
    to: '/add-credit',
    icon: transactionsIcon,
    iconClassName: styles.addCreditCardIcon,
  },
]

function HomePage() {
  const { showError, showSuccess } = useToast()
  const companyLabel = '.Total'
  const [riders, setRiders] = useState([])
  const [stations, setStations] = useState([])
  const [transactions, setTransactions] = useState([])
  const [stats, setStats] = useState({ total: 0, pending: 0, paid: 0 })
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
      stations.map((station) => ({
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

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroTop}>
          <h1 className={styles.title}>Dashboard</h1>
          <span className={styles.companyMark}>{companyLabel}</span>
        </div>
        <p className={styles.description}>
          Track core workflows from one place with live backend records flowing
          into the dashboard.
        </p>
      </header>

      {isLoading ? <p className={styles.feedbackMessage}>Loading dashboard data...</p> : null}

      <section className={styles.statsGrid} aria-label="Dashboard highlights">
        <article className={styles.statCard}>
          <h2>Total Riders</h2>
          <div className={styles.metricRow}>
            <img
              src={ridersIcon}
              alt=""
              aria-hidden="true"
              className={`${styles.metricIcon} ${styles.ridersIcon}`}
            />
            <p className={styles.statValue}>{riders.length}</p>
          </div>
          <span className={styles.statMeta}>active records loaded</span>
        </article>
        <article className={styles.statCard}>
          <h2>Total Stations</h2>
          <div className={styles.metricRow}>
            <img
              src={stationsIcon}
              alt=""
              aria-hidden="true"
              className={`${styles.metricIcon} ${styles.stationsIcon}`}
            />
            <p className={styles.statValue}>{stations.length}</p>
          </div>
          <span className={styles.statMeta}>partner locations loaded</span>
        </article>
        <article className={`${styles.statCard} ${styles.statCardWide}`}>
          <h2>Credit Activity</h2>
          <div className={styles.metricRow}>
            <img
              src={transactionsIcon}
              alt=""
              aria-hidden="true"
              className={`${styles.metricIcon} ${styles.transactionsIcon}`}
            />
            <p className={styles.statValue}>{stats.total}</p>
          </div>
          <span className={styles.statMeta}>{stats.pending} pending transactions</span>
        </article>
      </section>

      <section className={styles.extensionGrid} aria-label="Quick entries">
        <article className={styles.extensionCard}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionTag}>Live form preview</p>
            <h2>Credit entry form</h2>
            <p>
              Create a quick transaction from the dashboard using live rider and
              station options.
            </p>
          </div>
          <CreditForm
            riders={riders}
            stations={stations}
            onSubmit={handleQuickCredit}
            submitLabel="Save From Dashboard"
            isSubmitting={isSubmitting}
          />
        </article>

        <article className={styles.extensionCard}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionTag}>Station list</p>
            <h2>Station directory</h2>
            <p>
              Reference every active partner station without leaving the dashboard.
            </p>
          </div>
          <StationList stations={stationListRows} />
        </article>
      </section>

      <section className={styles.tableSection}>
        <div className={styles.sectionHeader}>
          <p className={styles.sectionTag}>Recent activity</p>
          <h2>Credit transactions</h2>
          <p>
            The same live transaction feed that powers the Transactions page is
            surfaced here for quick review.
          </p>
        </div>
        <CreditTable transactions={tableTransactions} showPhone={false} />
      </section>

      <section className={styles.cardGrid} aria-label="Primary navigation">
        {dashboardSections.map((section) => (
          <article key={section.to} className={styles.navCard}>
            <img
              src={section.icon}
              alt=""
              aria-hidden="true"
              className={`${styles.navCardIcon} ${section.iconClassName}`}
            />
            <h2>{section.title}</h2>
            <p>{section.description}</p>
            <Link to={section.to} className={styles.cardLink}>
              Open section
            </Link>
          </article>
        ))}
      </section>
    </main>
  )
}

export default HomePage

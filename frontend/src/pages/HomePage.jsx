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
  const { user } = useAuth()
  const { showError, showSuccess } = useToast()
  const companyLabel =
    user?.role !== 'rider' && user?.companyName ? `.${user.companyName}` : ''
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

  const visibleDashboardSections = useMemo(
    () => dashboardSections.filter((section) => section.to !== '/add-credit'),
    []
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
      title: 'Dashboard',
      companyMark: companyLabel,
      description:
        'Track core workflows from one place with live backend records flowing into the dashboard.',
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
        title: 'Total Riders',
        value: riders.length,
        meta: 'active records loaded',
        icon: ridersIcon,
        iconClassName: styles.ridersIcon,
      },
      {
        title: 'Total Stations',
        value: stations.length,
        meta: 'partner locations loaded',
        icon: stationsIcon,
        iconClassName: styles.stationsIcon,
      },
      {
        title: 'Credit Activity',
        value: stats.total,
        meta: `${stats.pending} pending transactions`,
        icon: transactionsIcon,
        iconClassName: styles.transactionsIcon,
        wide: true,
      },
    ]
  }, [primaryRider?.currentBalance, riders.length, role, stations.length, stats.pending, stats.total])

  const showQuickCredit = role === 'rider'
  const showStationDirectory = role === 'company'
  const showNavCards = role === 'company'

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

      <section className={styles.statsGrid} aria-label="Dashboard highlights">
        {statCards.map((card) => (
          <article
            key={card.title}
            className={`${styles.statCard} ${card.wide ? styles.statCardWide : ''}`}
          >
            <h2>{card.title}</h2>
            <div className={styles.metricRow}>
              <img
                src={card.icon}
                alt=""
                aria-hidden="true"
                className={`${styles.metricIcon} ${card.iconClassName}`}
              />
              <p className={styles.statValue}>{card.value}</p>
            </div>
            <span className={styles.statMeta}>{card.meta}</span>
          </article>
        ))}
      </section>

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
                <p className={styles.sectionTag}>Station list</p>
                <h2>Station directory</h2>
                <p>
                  Reference every active partner station without leaving the dashboard.
                </p>
              </div>
              <StationList stations={stationListRows} />
            </article>
          ) : null}

          {role === 'rider' && primaryStation ? null : null}
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

      {showNavCards ? (
        <section className={styles.cardGrid} aria-label="Primary navigation">
          {visibleDashboardSections.map((section) => (
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
      ) : null}
    </main>
  )
}

export default HomePage

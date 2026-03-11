import { Link } from 'react-router-dom'
import CreditForm from '../components/CreditForm'
import CreditTable from '../components/CreditTable'
import StationList from '../components/StationList'
import styles from './HomePage.module.css'
import {
  riders as sampleRiders,
  stations as sampleStations,
  transactions as sampleTransactions,
} from '../data/mockData'

const dashboardSections = [
  {
    title: 'Riders',
    description: 'Manage rider profiles, debt status, and activity tracking.',
    to: '/riders',
  },
  {
    title: 'Fuel Stations',
    description: 'Organize station records and monitor station credit balances.',
    to: '/stations',
  },
  {
    title: 'Transactions',
    description: 'Review credit transactions and reconcile outstanding balances.',
    to: '/transactions',
  },
  {
    title: 'Add Credit',
    description: 'Prepare manual credit entries before API integration begins.',
    to: '/add-credit',
  },
]

const tableTransactions = sampleTransactions.map((tx) => ({
  id: tx.id,
  rider: tx.rider,
  station: tx.station,
  phone: tx.phone,
  number_plate: tx.number_plate,
  amount: tx.amount,
  litres: tx.litres,
  date: tx.id.split('-').slice(0, 3).join('-'),
  status: tx.status,
}))

function HomePage() {
  const handleQuickCredit = (formData) => {
    console.log('Quick credit entry:', formData)
  }

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>Boda Credit Dashboard</h1>
        <p className={styles.description}>
          Track core frontend workflows from one place. This dashboard is ready
          for future UI component expansion and backend integration.
        </p>
      </header>

      <section className={styles.statsGrid} aria-label="Dashboard highlights">
        <article className={styles.statCard}>
          <h2>Total Riders</h2>
          <p>Placeholder metric for rider registry volume.</p>
        </article>
        <article className={styles.statCard}>
          <h2>Total Stations</h2>
          <p>Placeholder metric for active fuel station partners.</p>
        </article>
        <article className={styles.statCard}>
          <h2>Credit Activity</h2>
          <p>Placeholder metric for overall transaction movement.</p>
        </article>
      </section>

      <section className={styles.extensionGrid} aria-label="Quick entries">
        <article className={styles.extensionCard}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionTag}>Live form preview</p>
            <h2>Credit entry form</h2>
            <p>
              Fill a credit transaction to see how the form behaves before the
              backend is wired.
            </p>
          </div>
          <CreditForm
            riders={sampleRiders}
            stations={sampleStations}
            onSubmit={handleQuickCredit}
          />
        </article>

        <article className={styles.extensionCard}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionTag}>Station list</p>
            <h2>Station directory</h2>
            <p>
              Reference every onboarding station without leaving the dashboard.
            </p>
          </div>
          <StationList stations={sampleStations} />
        </article>
      </section>

      <section className={styles.tableSection}>
        <div className={styles.sectionHeader}>
          <p className={styles.sectionTag}>Recent activity</p>
          <h2>Credit transactions</h2>
          <p>
            The same transaction table that will power the Transactions page is
            already visible here for quick validation.
          </p>
        </div>
        <CreditTable transactions={tableTransactions} />
      </section>

      <section className={styles.cardGrid} aria-label="Primary navigation">
        {dashboardSections.map((section) => (
          <article key={section.to} className={styles.navCard}>
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

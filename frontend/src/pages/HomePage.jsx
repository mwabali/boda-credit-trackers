import { Link } from 'react-router-dom'
import styles from './HomePage.module.css'

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

function HomePage() {
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

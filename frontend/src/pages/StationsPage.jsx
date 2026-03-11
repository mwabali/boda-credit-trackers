import styles from './StationsPage.module.css'
import StationList from '../components/StationList'
import { stations } from '../data/mockData'

function StationsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Fuel Stations Network</h1>
        <p className={styles.description}>
          Placeholder station directory for card components and station detail
          workflows that will be expanded in future iterations.
        </p>
      </header>

      <section className={styles.statsGrid} aria-label="Station summary">
        <article className={styles.statCard}>
          <h2>Total Stations</h2>
          <p>62</p>
        </article>
        <article className={styles.statCard}>
          <h2>Total KES Owed</h2>
          <p>KES 2,500,000</p>
        </article>
        <article className={styles.statCard}>
          <h2>Total Litres Pumped</h2>
          <p>15,000L</p>
        </article>
      </section>

      <section className={styles.cardsGrid} aria-label="Station cards">
        {stations.map((station) => (
          <article key={station.id} className={styles.stationCard}>
            <h2>
              {station.id} <span>{station.name}</span>
            </h2>
            <ul>
              <li>
                <strong>Location:</strong> {station.location}
              </li>
              <li>
                <strong>Phone:</strong> {station.phone}
              </li>
              <li>
                <strong>Total Owed:</strong> {station.owed}
              </li>
            </ul>
          </article>
        ))}
      </section>

      <div className={styles.listSection}>
        <div>
          <h2 className={styles.listHeading}>Station directory</h2>
          <p className={styles.listDescription}>
            Track the active stations in a tabular view for quick reference.
          </p>
        </div>
        <StationList stations={stations} />
      </div>
    </main>
  )
}

export default StationsPage

import styles from './StationsPage.module.css'

function StationsPage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Fuel Stations</h1>
      <p className={styles.description}>
        This page will organize registered stations, operational details, and
        station-level credit exposure.
      </p>
    </main>
  )
}

export default StationsPage

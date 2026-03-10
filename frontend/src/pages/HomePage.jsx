import styles from './HomePage.module.css'

function HomePage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Boda Credit Tracker Dashboard</h1>
      <p className={styles.description}>
        This home page will provide quick navigation and summary visibility for
        rider and station credit activity.
      </p>
      <section className={styles.leadCard}>
        A dashboard layout foundation is now in place and ready for Taran's
        component implementation phase.
      </section>
    </main>
  )
}

export default HomePage

import styles from './RidersPage.module.css'

function RidersPage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Riders Management</h1>
      <p className={styles.description}>
        This page will handle rider records, status views, and debt snapshots
        for ongoing credit management.
      </p>
    </main>
  )
}

export default RidersPage

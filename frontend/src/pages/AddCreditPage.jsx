import styles from './AddCreditPage.module.css'

function AddCreditPage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Add Credit</h1>
      <p className={styles.description}>
        This page will support manual fuel credit entry and prepare data capture
        for backend integration in a later phase.
      </p>
    </main>
  )
}

export default AddCreditPage

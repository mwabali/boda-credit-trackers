import styles from './TransactionsPage.module.css'

function TransactionsPage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Credit Transactions</h1>
      <p className={styles.description}>
        This page will present credit transaction history and help teams review
        payment and reconciliation progress.
      </p>
    </main>
  )
}

export default TransactionsPage

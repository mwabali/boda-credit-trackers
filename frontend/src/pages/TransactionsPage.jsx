import CreditTable from '../components/CreditTable'
import styles from './TransactionsPage.module.css'
import { transactions } from '../data/mockData'

function TransactionsPage() {
  // Transform transactions data for CreditTable component
  const tableTransactions = transactions.map(tx => ({
    id: tx.id,
    rider: tx.rider,
    station: tx.station,
    number_plate: tx.number_plate,
    phone: tx.phone,
    amount: tx.amount,
    litres: tx.litres,
    date: tx.id.split('-').slice(0,3).join('-'),
    status: tx.status
  }))

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Credit Transaction Log</h1>
        <p className={styles.description}>
          Placeholder transaction table for future filters, pagination, and
          backend-powered reconciliation workflows.
        </p>
      </header>

      <section className={styles.statsGrid} aria-label="Transaction summary">
        <article className={styles.statCard}>
          <h2>Total Credit Transactions</h2>
          <p>110,000+</p>
        </article>
        <article className={styles.statCard}>
          <h2>Monthly KES Pumped</h2>
          <p>KES 500,000</p>
        </article>
        <article className={styles.statCard}>
          <h2>Pending Payments</h2>
          <p>15,000</p>
        </article>
      </section>

      <CreditTable transactions={tableTransactions} showPhone={false} />
    </main>
  )
}

export default TransactionsPage

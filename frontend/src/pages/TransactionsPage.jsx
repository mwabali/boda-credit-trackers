import CreditTable from '../components/CreditTable'
import styles from './TransactionsPage.module.css'

const transactions = [
  {
    id: 'TXN-2026-03-01-1001',
    rider: 'James Kamau (R001)',
    station: 'City Centre Petro (FS001)',
    amount: 'KES 11,000',
    litres: '25L',
    status: 'Paid',
  },
  {
    id: 'TXN-2026-03-01-1002',
    rider: 'Mary Wambui (R002)',
    station: 'Karen Total (FS002)',
    amount: 'KES 22,000',
    litres: '50L',
    status: 'Unpaid',
  },
  {
    id: 'TXN-2026-03-01-1003',
    rider: 'David Ochieng (R003)',
    station: 'Kasarani Rubis (FS003)',
    amount: 'KES 15,000',
    litres: '12L',
    status: 'Pending',
  },
  {
    id: 'TXN-2026-03-01-1004',
    rider: 'Faith Njeri (R004)',
    station: 'Westlands Shell (FS004)',
    amount: 'KES 9,500',
    litres: '9L',
    status: 'Paid',
  },
  {
    id: 'TXN-2026-03-01-1005',
    rider: 'Peter Mwangi (R005)',
    station: 'Syokimau Petro (FS005)',
    amount: 'KES 14,200',
    litres: '14L',
    status: 'Pending',
  },
]

function TransactionsPage() {
  // Transform transactions data for CreditTable component
  const tableTransactions = transactions.map(tx => ({
    id: tx.id,
    rider: tx.rider,
    station: tx.station,
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

      <CreditTable transactions={tableTransactions} />
    </main>
  )
}

export default TransactionsPage

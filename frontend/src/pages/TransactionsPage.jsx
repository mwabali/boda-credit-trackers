import { useEffect, useMemo, useState } from 'react'
import CreditTable from '../components/CreditTable'
import { request } from '../lib/api'
import { formatCurrency } from '../lib/formatters'
import { mapTransactionToRow } from '../lib/mappers'
import styles from './TransactionsPage.module.css'

function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [stats, setStats] = useState({ total: 0, pending: 0, paid: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadTransactions() {
      try {
        setIsLoading(true)
        setError('')

        const [transactionsPayload, statsPayload] = await Promise.all([
          request('/transactions?include=all'),
          request('/transactions/stats/dashboard'),
        ])

        setTransactions(transactionsPayload.data || [])
        setStats(statsPayload.data || { total: 0, pending: 0, paid: 0 })
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadTransactions()
  }, [])

  const tableTransactions = useMemo(
    () => transactions.map(mapTransactionToRow),
    [transactions]
  )

  const currentMonthAmount = useMemo(() => {
    const now = new Date()

    return transactions.reduce((sum, transaction) => {
      const transactionDate = new Date(transaction.createdAt)
      const isSameMonth =
        transactionDate.getMonth() === now.getMonth() &&
        transactionDate.getFullYear() === now.getFullYear()

      return isSameMonth ? sum + Number(transaction.amount || 0) : sum
    }, 0)
  }, [transactions])

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Credit Transaction Log</h1>
        <p className={styles.description}>
          Live transaction table backed by the current backend credit records.
        </p>
      </header>

      <section className={styles.statsGrid} aria-label="Transaction summary">
        <article className={styles.statCard}>
          <h2>Total Credit Transactions</h2>
          <p>{stats.total}</p>
        </article>
        <article className={styles.statCard}>
          <h2>Monthly KES Pumped</h2>
          <p>{formatCurrency(currentMonthAmount)}</p>
        </article>
        <article className={styles.statCard}>
          <h2>Pending Payments</h2>
          <p>{stats.pending}</p>
        </article>
      </section>

      {isLoading ? <p className={styles.stateMessage}>Loading transactions...</p> : null}
      {error ? <p className={styles.errorMessage}>{error}</p> : null}

      {!isLoading && !error ? (
        <CreditTable transactions={tableTransactions} showPhone={false} />
      ) : null}
    </main>
  )
}

export default TransactionsPage

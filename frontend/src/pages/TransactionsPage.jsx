import { useEffect, useMemo, useState } from 'react'
import transactionsIcon from '../assets/Transactions_icon.svg'
import CreditTable from '../components/CreditTable'
import { request } from '../lib/api'
import { formatCurrency } from '../lib/formatters'
import { getTransactionTimestamp, mapTransactionToRow } from '../lib/mappers'
import styles from './TransactionsPage.module.css'

function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [stats, setStats] = useState({ total: 0, pending: 0, paid: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
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
      const timestamp = getTransactionTimestamp(transaction)
      if (!timestamp) {
        return sum
      }

      const transactionDate = new Date(timestamp)
      const isSameMonth =
        transactionDate.getMonth() === now.getMonth() &&
        transactionDate.getFullYear() === now.getFullYear()

      return isSameMonth ? sum + Number(transaction.amount || 0) : sum
    }, 0)
  }, [transactions])

  const handleStatusChange = async (transactionId, status) => {
    try {
      setIsUpdatingStatus(true)
      setError('')

      await request(`/transactions/${transactionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })

      setTransactions((prev) =>
        prev.map((transaction) =>
          transaction.id === transactionId ? { ...transaction, status } : transaction
        )
      )

      setStats((prev) => {
        const nextTransactions = transactions.map((transaction) =>
          transaction.id === transactionId ? { ...transaction, status } : transaction
        )

        return {
          total: nextTransactions.length,
          pending: nextTransactions.filter((transaction) => transaction.status === 'pending').length,
          paid: nextTransactions.filter((transaction) => transaction.status === 'paid').length,
        }
      })
    } catch (updateError) {
      setError(updateError.message)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

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
          <div className={styles.metricRow}>
            <img
              src={transactionsIcon}
              alt=""
              aria-hidden="true"
              className={`${styles.metricIcon} ${styles.totalIcon}`}
            />
            <p className={styles.statValue}>{stats.total}</p>
          </div>
          <span className={styles.statMeta}>credit records in the ledger</span>
        </article>
        <article className={styles.statCard}>
          <h2>Monthly KES Pumped</h2>
          <div className={styles.metricRow}>
            <img
              src={transactionsIcon}
              alt=""
              aria-hidden="true"
              className={`${styles.metricIcon} ${styles.monthlyIcon}`}
            />
            <p className={styles.statValue}>{formatCurrency(currentMonthAmount)}</p>
          </div>
          <span className={styles.statMeta}>amount recorded this month</span>
        </article>
        <article className={styles.statCard}>
          <h2>Pending Payments</h2>
          <div className={styles.metricRow}>
            <img
              src={transactionsIcon}
              alt=""
              aria-hidden="true"
              className={`${styles.metricIcon} ${styles.pendingIcon}`}
            />
            <p className={styles.statValue}>{stats.pending}</p>
          </div>
          <span className={styles.statMeta}>transactions awaiting settlement</span>
        </article>
      </section>

      {isLoading ? <p className={styles.stateMessage}>Loading transactions...</p> : null}
      {error ? <p className={styles.errorMessage}>{error}</p> : null}

      {!isLoading && !error ? (
        <CreditTable
          transactions={tableTransactions}
          showPhone={false}
          onStatusChange={handleStatusChange}
          isUpdatingStatus={isUpdatingStatus}
        />
      ) : null}
    </main>
  )
}

export default TransactionsPage

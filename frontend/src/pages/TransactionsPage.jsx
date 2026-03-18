import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import transactionsIcon from '../assets/Transactions_icon.svg'
import CreditTable from '../components/CreditTable'
import { useToast } from '../components/ToastProvider'
import { request } from '../lib/api'
import { getTransactionTimestamp, mapTransactionToRow } from '../lib/mappers'
import styles from './TransactionsPage.module.css'

function formatCompactKes(value) {
  if (!value) return '0K'

  const roundedThousands = Math.round(Number(value) / 1000)
  return `${roundedThousands}K`
}

function TransactionsPage() {
  const { user } = useAuth()
  const { showError, showSuccess } = useToast()
  const [transactions, setTransactions] = useState([])
  const [stats, setStats] = useState({ total: 0, pending: 0, paid: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isDeletingTransaction, setIsDeletingTransaction] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [error, setError] = useState('')

  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')

      const transactionsPayload = await request('/transactions?include=all&stats=dashboard')

      setTransactions(transactionsPayload.data || [])
      setStats(transactionsPayload.stats || { total: 0, pending: 0, paid: 0 })
    } catch (loadError) {
      setError(loadError.message)
      showError(loadError.message)
    } finally {
      setIsLoading(false)
    }
  }, [showError])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

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

  const currentMonthAmountDisplay = useMemo(
    () => formatCompactKes(currentMonthAmount),
    [currentMonthAmount]
  )

  const handleStatusChange = async (transactionId, status) => {
    try {
      setIsUpdatingStatus(true)
      setError('')

      await request(`/transactions/${transactionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })

      showSuccess('Transaction status updated successfully.', 'Status updated')
      await loadTransactions()
    } catch (updateError) {
      setError(updateError.message)
      showError(updateError.message)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const requestDeleteTransaction = (transactionId) => {
    setPendingDeleteId(transactionId)
  }

  const handleDeleteTransaction = async () => {
    if (!pendingDeleteId) {
      return
    }

    try {
      setIsDeletingTransaction(true)
      setError('')

      await request(`/transactions/${pendingDeleteId}`, {
        method: 'DELETE',
      })

      showSuccess('Transaction deleted successfully.', 'Entry removed')
      await loadTransactions()
      setPendingDeleteId(null)
    } catch (deleteError) {
      setError(deleteError.message)
      showError(deleteError.message)
    } finally {
      setIsDeletingTransaction(false)
    }
  }

  const canManageTransactions = user?.role === 'company' || user?.role === 'station'
  const pageTitle =
    user?.role === 'rider' ? 'My Credit Activity' : 'Credit Transaction Log'
  const pageDescription =
    user?.role === 'rider'
      ? 'Review the credit entries linked to your rider account.'
      : 'Live transaction table backed by the current backend credit records.'

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{pageTitle}</h1>
        <p className={styles.description}>{pageDescription}</p>
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
        <article className={`${styles.statCard} ${styles.amountCard}`}>
          <h2>Monthly KES Pumped</h2>
          <div className={`${styles.metricRow} ${styles.amountMetricRow}`}>
            <img
              src={transactionsIcon}
              alt=""
              aria-hidden="true"
              className={`${styles.metricIcon} ${styles.monthlyIcon}`}
            />
            <p className={`${styles.statValue} ${styles.amountValue}`}>
              {currentMonthAmountDisplay}
            </p>
          </div>
          <span className={styles.statMeta}>rounded monthly amount recorded in KES</span>
        </article>
        <article className={`${styles.statCard} ${styles.statCardWide}`}>
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
      {!isLoading && !error ? (
        <CreditTable
          transactions={tableTransactions}
          showPhone={false}
          onStatusChange={canManageTransactions ? handleStatusChange : undefined}
          onDeleteTransaction={canManageTransactions ? requestDeleteTransaction : undefined}
          isUpdatingStatus={isUpdatingStatus}
          isDeletingTransaction={isDeletingTransaction}
        />
      ) : null}

      {pendingDeleteId && canManageTransactions ? (
        <div className={styles.modalOverlay} role="presentation">
          <div
            className={styles.confirmationModal}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-transaction-title"
            aria-describedby="delete-transaction-description"
          >
            <p className={styles.modalEyebrow}>Delete Transaction</p>
            <h2 id="delete-transaction-title" className={styles.modalTitle}>
              Remove this credit record?
            </h2>
            <p
              id="delete-transaction-description"
              className={styles.modalDescription}
            >
              This will permanently remove the transaction from the ledger and
              update the rider balance immediately. This action cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalSecondaryButton}
                onClick={() => setPendingDeleteId(null)}
                disabled={isDeletingTransaction}
              >
                Keep entry
              </button>
              <button
                type="button"
                className={styles.modalDangerButton}
                onClick={handleDeleteTransaction}
                disabled={isDeletingTransaction}
              >
                {isDeletingTransaction ? 'Deleting...' : 'Delete entry'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}

export default TransactionsPage

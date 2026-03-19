import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import transactionsIcon from '../assets/Transactions_icon.svg'
import CreditTable from '../components/CreditTable'
import { useToast } from '../components/ToastProvider'
import { formatCurrency } from '../lib/formatters'
import { request } from '../lib/api'
import { getStationDisplayName, getTransactionTimestamp, mapTransactionToRow } from '../lib/mappers'
import styles from './TransactionsPage.module.css'

function formatCompactKes(value) {
  if (!value) return '0K'

  const roundedThousands = Math.round(Number(value) / 1000)
  return `${roundedThousands}K`
}

function getTransactionStationLabel(transaction) {
  if (transaction.stationName) {
    return transaction.stationName
  }

  if (transaction.station) {
    const stationName = getStationDisplayName(transaction.station)
    if (stationName) {
      return stationName
    }
  }

  return 'Unknown station'
}

function TransactionsPage() {
  const { user } = useAuth()
  const { showError, showSuccess } = useToast()
  const [transactions, setTransactions] = useState([])
  const [stats, setStats] = useState({ total: 0, pending: 0, paid: 0 })
  const [companyFocus, setCompanyFocus] = useState('stations')
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

  const averageRequestValue = useMemo(() => {
    if (!transactions.length) {
      return 0
    }

    const total = transactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0)
    return total / transactions.length
  }, [transactions])

  const settledValue = useMemo(
    () =>
      transactions.reduce((sum, transaction) => {
        return transaction.status === 'paid' ? sum + Number(transaction.amount || 0) : sum
      }, 0),
    [transactions]
  )

  const approvedOrPaidCount = useMemo(
    () =>
      transactions.filter((transaction) =>
        transaction.status === 'approved' || transaction.status === 'paid'
      ).length,
    [transactions]
  )

  const stationBreakdown = useMemo(() => {
    const grouped = new Map()

    transactions.forEach((transaction) => {
      const stationLabel = getTransactionStationLabel(transaction)
      const key = transaction.stationId || transaction.station?.id || stationLabel || 'Unassigned'
      const current = grouped.get(key) || {
        key,
        name: stationLabel,
        count: 0,
        amount: 0,
        pending: 0,
        approvedOrPaid: 0,
      }

      current.count += 1
      current.amount += Number(transaction.amount || 0)
      if (transaction.status === 'pending') {
        current.pending += 1
      }
      if (transaction.status === 'approved' || transaction.status === 'paid') {
        current.approvedOrPaid += 1
      }

      grouped.set(key, current)
    })

    return [...grouped.values()]
  }, [transactions])

  const transactionFocusSummary = useMemo(() => {
    switch (companyFocus) {
      case 'status':
        return {
          label: 'Status flow',
          description: 'Shows where requests are sitting in the operating flow right now.',
        }
      case 'value':
        return {
          label: 'Request size bands',
          description: 'Helps you see whether demand is clustering around smaller or larger tickets.',
        }
      case 'stations':
      default:
        return {
          label: 'Station contribution',
          description: 'Compares how much transaction volume each station is carrying.',
        }
    }
  }, [companyFocus])

  const transactionFocusRows = useMemo(() => {
    if (companyFocus === 'status') {
      const rows = [
        {
          id: 'pending',
          name: 'Pending',
          subtitle: 'Awaiting station action',
          value: `${stats.pending}`,
          meter: transactions.length ? Math.max(10, Math.round((stats.pending / transactions.length) * 100)) : 0,
        },
        {
          id: 'approved',
          name: 'Approved / Paid',
          subtitle: 'Moved forward successfully',
          value: `${approvedOrPaidCount}`,
          meter: transactions.length
            ? Math.max(10, Math.round((approvedOrPaidCount / transactions.length) * 100))
            : 0,
        },
        {
          id: 'cancelled',
          name: 'Declined',
          subtitle: 'Stopped before fulfilment',
          value: `${transactions.filter((transaction) => transaction.status === 'cancelled').length}`,
          meter: transactions.length
            ? Math.max(
                10,
                Math.round(
                  (transactions.filter((transaction) => transaction.status === 'cancelled').length /
                    transactions.length) *
                    100
                )
              )
            : 0,
        },
      ]

      return rows
    }

    if (companyFocus === 'value') {
      const low = transactions.filter((transaction) => Number(transaction.amount || 0) < 3000).length
      const mid = transactions.filter((transaction) => {
        const amount = Number(transaction.amount || 0)
        return amount >= 3000 && amount < 8000
      }).length
      const high = transactions.filter((transaction) => Number(transaction.amount || 0) >= 8000).length

      return [
        {
          id: 'low',
          name: 'Below Ksh 3,000',
          subtitle: 'Smaller routine requests',
          value: `${low}`,
          meter: transactions.length ? Math.max(10, Math.round((low / transactions.length) * 100)) : 0,
        },
        {
          id: 'mid',
          name: 'Ksh 3,000 to 7,999',
          subtitle: 'Mid-ticket requests',
          value: `${mid}`,
          meter: transactions.length ? Math.max(10, Math.round((mid / transactions.length) * 100)) : 0,
        },
        {
          id: 'high',
          name: 'Ksh 8,000 and above',
          subtitle: 'Higher exposure requests',
          value: `${high}`,
          meter: transactions.length ? Math.max(10, Math.round((high / transactions.length) * 100)) : 0,
        },
      ]
    }

    const maxAmount = stationBreakdown.reduce((max, station) => Math.max(max, station.amount), 0)

    return [...stationBreakdown]
      .sort((left, right) => right.amount - left.amount)
      .slice(0, 3)
      .map((station) => ({
        id: `station-${station.key}`,
        name: station.name,
        subtitle: `${station.count} requests • ${station.pending} pending`,
        value: formatCompactKes(station.amount),
        meter: maxAmount ? Math.max(12, Math.round((station.amount / maxAmount) * 100)) : 12,
      }))
  }, [approvedOrPaidCount, companyFocus, stationBreakdown, stats.pending, transactions])

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

  const canManageTransactions = user?.role === 'station'
  const pageTitle =
    user?.role === 'rider'
      ? 'My Credit Activity'
      : user?.role === 'station'
        ? 'Approval Queue'
        : 'Transaction Performance'
  const pageDescription =
    user?.role === 'rider'
      ? 'Review the credit entries linked to your rider account.'
      : user?.role === 'station'
        ? 'Review rider requests and decide what moves forward.'
        : 'Monitor company-wide request flow, settlement quality, and station load distribution.'

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{pageTitle}</h1>
        <p className={styles.description}>{pageDescription}</p>
      </header>

      <section className={styles.statsGrid} aria-label="Transaction summary">
        <article className={styles.statCard}>
          <h2>{user?.role === 'station' ? 'Requests Logged' : 'Total Credit Transactions'}</h2>
          <div className={styles.metricRow}>
            <img
              src={transactionsIcon}
              alt=""
              aria-hidden="true"
              className={`${styles.metricIcon} ${styles.totalIcon}`}
            />
            <p className={styles.statValue}>{stats.total}</p>
          </div>
          <span className={styles.statMeta}>
            {user?.role === 'station'
              ? 'requests at your station'
              : 'credit records in the ledger'}
          </span>
        </article>
        <article className={`${styles.statCard} ${styles.amountCard}`}>
          <h2>{user?.role === 'station' ? 'Monthly KES Requested' : 'Monthly KES Pumped'}</h2>
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
          <span className={styles.statMeta}>
            {user?.role === 'station'
              ? 'rounded request value this month'
              : 'rounded monthly amount recorded in KES'}
          </span>
        </article>
        <article className={`${styles.statCard} ${styles.statCardWide}`}>
          <h2>{user?.role === 'station' ? 'Awaiting Review' : 'Pending Payments'}</h2>
          <div className={styles.metricRow}>
            <img
              src={transactionsIcon}
              alt=""
              aria-hidden="true"
              className={`${styles.metricIcon} ${styles.pendingIcon}`}
            />
            <p className={styles.statValue}>{stats.pending}</p>
          </div>
          <span className={styles.statMeta}>
            {user?.role === 'station'
              ? 'requests still awaiting action'
              : 'transactions awaiting settlement'}
          </span>
        </article>
      </section>

      {user?.role === 'company' ? (
        <section className={`${styles.analyticsGrid} ${styles.companyAnalyticsGrid}`} aria-label="Transaction analytics">
          <article className={`${styles.insightPanel} ${styles.flowPanel}`}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelEyebrow}>Flow health</p>
                <h2 className={styles.panelTitle}>Settlement posture</h2>
              </div>
              <span className={styles.panelBadge}>{transactions.length} requests</span>
            </div>

            <div className={styles.panelStatsGrid}>
              <div className={styles.panelStat}>
                <span>Approval conversion</span>
                <strong>
                  {transactions.length
                    ? `${Math.round((approvedOrPaidCount / transactions.length) * 100)}%`
                    : '0%'}
                </strong>
              </div>
              <div className={styles.panelStat}>
                <span>Settled value</span>
                <strong>{formatCompactKes(settledValue)}</strong>
              </div>
              <div className={styles.panelStat}>
                <span>Avg request</span>
                <strong>{formatCurrency(averageRequestValue)}</strong>
              </div>
              <div className={styles.panelStat}>
                <span>Active stations</span>
                <strong>{stationBreakdown.length}</strong>
              </div>
            </div>
          </article>

          <article className={`${styles.insightPanel} ${styles.signalPanel}`}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelEyebrow}>Live view</p>
                <h2 className={styles.panelTitle}>Request signals</h2>
              </div>
            </div>

            <div className={styles.toggleRow} role="tablist" aria-label="Transaction analytics focus">
              {[
                ['stations', 'Stations'],
                ['status', 'Status'],
                ['value', 'Value bands'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={companyFocus === value ? styles.toggleActive : styles.toggleButton}
                  onClick={() => setCompanyFocus(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className={styles.focusSummary}>
              <div>
                <p className={styles.focusEyebrow}>Now tracking</p>
                <h3 className={styles.focusTitle}>{transactionFocusSummary.label}</h3>
                <p className={styles.focusDescription}>{transactionFocusSummary.description}</p>
              </div>
            </div>

            <div className={styles.focusList}>
              {transactionFocusRows.length ? (
                transactionFocusRows.map((row) => (
                  <article key={`${companyFocus}-${row.id}`} className={styles.focusRow}>
                    <div className={styles.focusRowHeader}>
                      <div>
                        <h4>{row.name}</h4>
                        <p>{row.subtitle}</p>
                      </div>
                      <strong>{row.value}</strong>
                    </div>
                    <div className={styles.meterTrack}>
                      <span className={styles.meterFill} style={{ width: `${row.meter}%` }} />
                    </div>
                  </article>
                ))
              ) : (
                <p className={styles.stateMessage}>No transaction analytics available yet.</p>
              )}
            </div>
          </article>
        </section>
      ) : null}

      {user?.role !== 'company' && isLoading ? <p className={styles.stateMessage}>Loading transactions...</p> : null}
      {user?.role !== 'company' && !error ? (
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

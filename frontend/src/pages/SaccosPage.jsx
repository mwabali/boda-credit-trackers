import { useCallback, useEffect, useState } from 'react'
import { useToast } from '../components/ToastProvider'
import { formatCurrency, formatStatus } from '../lib/formatters'
import { request } from '../lib/api'
import styles from './SaccosPage.module.css'

function SaccosPage() {
  const { showError } = useToast()
  const [sacco, setSacco] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadSacco = useCallback(async () => {
    try {
      setIsLoading(true)
      const payload = await request('/saccos/me')
      setSacco(payload.data || null)
    } catch (error) {
      showError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [showError])

  useEffect(() => {
    loadSacco()
  }, [loadSacco])

  if (isLoading) {
    return <main className={styles.page}>Loading SACCO oversight...</main>
  }

  if (!sacco) {
    return <main className={styles.page}>SACCO profile not found.</main>
  }

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>SACCO Module</p>
        <h1>{sacco.name}</h1>
        <p>
          Insurance and oversight management for member riders, repayments, and outstanding fuel
          credit balances.
        </p>
      </header>

      <section className={styles.statsGrid} aria-label="SACCO summary">
        <article><span>Member riders</span><strong>{sacco.stats.riders}</strong></article>
        <article><span>Active riders</span><strong>{sacco.stats.activeRiders}</strong></article>
        <article><span>Credit records</span><strong>{sacco.stats.transactions}</strong></article>
        <article><span>Outstanding balance</span><strong>{formatCurrency(sacco.stats.outstandingAmount)}</strong></article>
        <article><span>Repaid value</span><strong>{formatCurrency(sacco.stats.paidAmount)}</strong></article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeading}>
          <div>
            <p className={styles.eyebrow}>Member oversight</p>
            <h2>Registered riders</h2>
          </div>
          <span>{sacco.riders.length} profiles</span>
        </div>
        {sacco.riders.length ? (
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th>Rider</th><th>Number plate</th><th>Phone</th><th>Balance</th><th>Status</th></tr></thead>
              <tbody>
                {sacco.riders.map((rider) => (
                  <tr key={rider.id}>
                    <td>{rider.name}</td>
                    <td>{rider.licensePlate}</td>
                    <td>{rider.phone}</td>
                    <td>{formatCurrency(rider.currentBalance)}</td>
                    <td>{formatStatus(rider.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p>No riders have joined this SACCO yet.</p>}
      </section>
    </main>
  )
}

export default SaccosPage

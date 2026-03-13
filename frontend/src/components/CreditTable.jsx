import styles from './CreditTable.module.css'

const STATUS_OPTIONS = ['pending', 'approved', 'paid', 'cancelled']

function CreditTable({
  transactions = [],
  showPhone = true,
  showNumberPlate = true,
  onStatusChange,
  isUpdatingStatus = false,
}) {
  if (!transactions.length) {
    return <p className={styles.emptyState}>No transactions recorded</p>
  }

  return (
    <section className={styles.wrapper} aria-label="Credit transactions table">
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Rider</th>
            {showPhone && <th>Phone</th>}
            {showNumberPlate && <th>Number Plate</th>}
            <th>Station</th>
            <th>Amount</th>
            <th>Litres</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const statusValue = tx.statusValue || tx.status.toLowerCase()

            return (
              <tr key={tx.id}>
                <td>{tx.rider}</td>
                {showPhone && <td>{tx.phone}</td>}
                {showNumberPlate && <td>{tx.number_plate}</td>}
                <td>{tx.station}</td>
                <td>{tx.amount}</td>
                <td>{tx.litres}</td>
                <td>{tx.date}</td>
                <td>
                  <span className={styles.statusCell}>
                    <span
                      className={`${styles.statusDot} ${styles[statusValue]}`}
                      aria-hidden="true"
                    />
                    {onStatusChange ? (
                      <select
                        className={`${styles.statusSelect} ${styles[statusValue]}`}
                        value={statusValue}
                        onChange={(event) => onStatusChange(tx.id, event.target.value)}
                        disabled={isUpdatingStatus}
                        aria-label={`Update transaction ${tx.id} status`}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span>{tx.status}</span>
                    )}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}

export default CreditTable

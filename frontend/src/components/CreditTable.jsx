import styles from './CreditTable.module.css'

const STATUS_OPTIONS = ['pending', 'approved', 'paid', 'cancelled']

function CreditTable({
  transactions = [],
  showPhone = true,
  showNumberPlate = true,
  showSacco = false,
  onStatusChange,
  onDeleteTransaction,
  isUpdatingStatus = false,
  isDeletingTransaction = false,
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
            {showSacco && <th>SACCO</th>}
            <th>Station</th>
            <th>Amount</th>
            <th>Litres</th>
            <th>Date</th>
            <th>Status</th>
            {onDeleteTransaction ? <th>Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const statusValue = tx.statusValue || tx.status.toLowerCase()
            const dotClassName = styles[`${statusValue}Dot`]

            return (
              <tr key={tx.id}>
                <td>
                  <span className={styles.riderCell}>
                    <span
                      className={`${styles.statusDot} ${dotClassName}`}
                      aria-hidden="true"
                    />
                    <span>{tx.rider}</span>
                  </span>
                </td>
                {showPhone && <td>{tx.phone}</td>}
                {showNumberPlate && <td>{tx.number_plate}</td>}
                {showSacco && <td>{tx.sacco}</td>}
                <td>{tx.station}</td>
                <td>{tx.amount}</td>
                <td>{tx.litres}</td>
                <td>{tx.date}</td>
                <td>
                  {onStatusChange ? (
                    <select
                      className={`${styles.statusSelect} ${styles[statusValue]}`}
                      value={statusValue}
                      onChange={(event) => onStatusChange(tx.id, event.target.value)}
                      disabled={isUpdatingStatus || isDeletingTransaction}
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
                </td>
                {onDeleteTransaction ? (
                  <td>
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => onDeleteTransaction(tx.id)}
                      disabled={isUpdatingStatus || isDeletingTransaction}
                      aria-label={`Delete transaction ${tx.id}`}
                    >
                      Delete
                    </button>
                  </td>
                ) : null}
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}

export default CreditTable

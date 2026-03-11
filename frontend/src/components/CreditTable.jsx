import styles from './CreditTable.module.css'

function CreditTable({ transactions = [] }) {
  if (!transactions.length) {
    return <p className={styles.emptyState}>No transactions recorded</p>
  }

  return (
    <section className={styles.wrapper} aria-label="Credit transactions table">
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Rider</th>
            <th>Phone</th>
            <th>Number Plate</th>
            <th>Station</th>
            <th>Amount</th>
            <th>Litres</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id}>
              <td>{tx.rider}</td>
              <td>{tx.phone}</td>
              <td>{tx.number_plate}</td>
              <td>{tx.station}</td>
              <td>{tx.amount}</td>
              <td>{tx.litres}</td>
              <td>{tx.date}</td>
              <td>{tx.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default CreditTable

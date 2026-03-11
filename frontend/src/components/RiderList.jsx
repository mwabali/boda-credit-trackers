import styles from './RiderList.module.css'

function RiderList({ riders = [] }) {
  if (!riders.length) {
    return <p className={styles.emptyState}>No riders available</p>
  }

  return (
    <section className={styles.listWrapper} aria-label="Riders list">
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Number Plate</th>
            <th>Phone Number</th>
          </tr>
        </thead>
        <tbody>
          {riders.map((rider) => (
            <tr key={rider.id}>
              <td>{rider.name}</td>
              <td>{rider.number_plate}</td>
              <td>{rider.phone_number}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default RiderList

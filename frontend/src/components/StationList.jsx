import styles from './StationList.module.css'
function StationList({ stations = [] }) {
  if (!stations.length) {
    return <p className={styles.emptyState}>No fuel stations available</p>
  }

  return (
    <section className={styles.wrapper} aria-label="Fuel stations list">
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Location</th>
            <th>Phone Number</th>
          </tr>
        </thead>
        <tbody>
          {stations.map((station) => (
            <tr key={station.id}>
              <td>{station.name}</td>
              <td>{station.location}</td>
              <td>{station.phone_number}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default StationList
import { getStationDisplayName } from '../lib/mappers'
import styles from './StationList.module.css'

function StationList({ stations = [], className = '' }) {
  if (!stations.length) {
    return <p className={styles.emptyState}>No fuel stations available</p>
  }

  return (
    <section
      className={`${styles.wrapper} ${className}`.trim()}
      aria-label="Fuel stations list"
    >
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Location</th>
            <th>Management Phoneline</th>
          </tr>
        </thead>
        <tbody>
          {stations.map((station) => (
            <tr key={station.id}>
              <td>{getStationDisplayName(station)}</td>
              <td>{station.location}</td>
              <td>{station.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default StationList

import styles from './StationsPage.module.css'

const stations = [
  { id: 'FS001', name: 'City Centre Petro', location: 'Nairobi CBD', phone: '+254 711 111 001', owed: 'KES 95,000' },
  { id: 'FS002', name: 'Karen Total', location: 'Nairobi Karen', phone: '+254 711 111 002', owed: 'KES 115,000' },
  { id: 'FS003', name: 'Kasarani Rubis', location: 'Nairobi Kasarani', phone: '+254 711 111 003', owed: 'KES 75,200' },
  { id: 'FS004', name: 'Westlands Shell', location: 'Nairobi Westlands', phone: '+254 711 111 004', owed: 'KES 62,500' },
  { id: 'FS005', name: 'Syokimau Petro', location: 'Machakos Syokimau', phone: '+254 711 111 005', owed: 'KES 88,300' },
  { id: 'FS006', name: 'Ngong Highway Oryx', location: 'Kajiado Ngong Road', phone: '+254 711 111 006', owed: 'KES 54,800' },
]

function StationsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Fuel Stations Network</h1>
        <p className={styles.description}>
          Placeholder station directory for card components and station detail
          workflows that will be expanded in future iterations.
        </p>
      </header>

      <section className={styles.statsGrid} aria-label="Station summary">
        <article className={styles.statCard}>
          <h2>Total Stations</h2>
          <p>62</p>
        </article>
        <article className={styles.statCard}>
          <h2>Total KES Owed</h2>
          <p>KES 2,500,000</p>
        </article>
        <article className={styles.statCard}>
          <h2>Total Litres Pumped</h2>
          <p>15,000L</p>
        </article>
      </section>

      <section className={styles.cardsGrid} aria-label="Station cards">
        {stations.map((station) => (
          <article key={station.id} className={styles.stationCard}>
            <h2>
              {station.id} <span>{station.name}</span>
            </h2>
            <ul>
              <li>
                <strong>Location:</strong> {station.location}
              </li>
              <li>
                <strong>Phone:</strong> {station.phone}
              </li>
              <li>
                <strong>Total Owed:</strong> {station.owed}
              </li>
            </ul>
          </article>
        ))}
      </section>
    </main>
  )
}

export default StationsPage

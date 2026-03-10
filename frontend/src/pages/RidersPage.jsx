import styles from './RidersPage.module.css'

const riderRows = [
  { id: 'R001', name: 'James Kamau', plate: 'KAB 123A', phone: '+254 711 001 001', debt: 'KES 12,500', status: 'Active' },
  { id: 'R002', name: 'Mary Wambui', plate: 'KAB 456B', phone: '+254 711 001 002', debt: 'KES 8,900', status: 'Active' },
  { id: 'R003', name: 'David Ochieng', plate: 'KAC 890C', phone: '+254 711 001 003', debt: 'KES 21,300', status: 'Suspended' },
  { id: 'R004', name: 'Faith Njeri', plate: 'KBD 225D', phone: '+254 711 001 004', debt: 'KES 3,200', status: 'Active' },
  { id: 'R005', name: 'Peter Mwangi', plate: 'KCE 779E', phone: '+254 711 001 005', debt: 'KES 15,400', status: 'Pending' },
]

function RidersPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Riders Management</h1>
        <p className={styles.description}>
          Placeholder rider registry view for table components and filters that
          will be expanded in the integration phase.
        </p>
      </header>

      <section className={styles.statsGrid} aria-label="Riders summary">
        <article className={styles.statCard}>
          <h2>Total Riders</h2>
          <p>45,172</p>
        </article>
        <article className={styles.statCard}>
          <h2>Active Riders</h2>
          <p>43,890</p>
        </article>
        <article className={styles.statCard}>
          <h2>Total Debt (Overall)</h2>
          <p>KES 3,165,000</p>
        </article>
      </section>

      <section className={styles.tableShell} aria-label="Riders list">
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Number Plate</th>
              <th>Phone</th>
              <th>Debt</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {riderRows.map((rider) => (
              <tr key={rider.id}>
                <td>{rider.id}</td>
                <td>{rider.name}</td>
                <td>{rider.plate}</td>
                <td>{rider.phone}</td>
                <td>{rider.debt}</td>
                <td>
                  <span className={`${styles.badge} ${styles[rider.status.toLowerCase()]}`}>
                    {rider.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}

export default RidersPage

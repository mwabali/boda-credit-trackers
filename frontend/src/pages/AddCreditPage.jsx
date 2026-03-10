import CreditForm from '../components/CreditForm'
import styles from './AddCreditPage.module.css'
import { riders as sampleRiders, stations as sampleStations } from '../data/mockData'

function AddCreditPage() {
  const handleSubmit = (formData) => {
    console.log('Credit submitted:', formData)
    // TODO: Connect to backend API
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Add Credit Transaction</h1>
        <p className={styles.description}>
          Add a new fuel credit entry for a rider at a specific station.
        </p>
      </header>

      <CreditForm
        riders={sampleRiders}
        stations={sampleStations}
        onSubmit={handleSubmit}
      />
    </main>
  )
}

export default AddCreditPage

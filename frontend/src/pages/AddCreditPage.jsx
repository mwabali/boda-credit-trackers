import styles from './AddCreditPage.module.css'

function AddCreditPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Add Credit Transaction</h1>
        <p className={styles.description}>
          Static form skeleton for manual fuel credit entry. Backend wiring and
          validation logic will be added during integration.
        </p>
      </header>

      <section className={styles.formShell} aria-label="Add credit form">
        <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
          <label className={styles.field} htmlFor="rider">
            Rider
            <select id="rider" name="rider" defaultValue="">
              <option value="" disabled>
                Select rider
              </option>
              <option>R001 - James Kamau</option>
              <option>R002 - Mary Wambui</option>
              <option>R003 - David Ochieng</option>
            </select>
          </label>

          <label className={styles.field} htmlFor="station">
            Station
            <select id="station" name="station" defaultValue="">
              <option value="" disabled>
                Select station
              </option>
              <option>FS001 - City Centre Petro</option>
              <option>FS002 - Karen Total</option>
              <option>FS003 - Kasarani Rubis</option>
            </select>
          </label>

          <label className={styles.field} htmlFor="amount">
            Amount (KES)
            <input id="amount" name="amount" type="number" placeholder="e.g. 1500" />
          </label>

          <label className={styles.field} htmlFor="litres">
            Litres
            <input id="litres" name="litres" type="number" placeholder="e.g. 5" />
          </label>

          <button type="submit" className={styles.submitButton}>
            Save Credit Entry
          </button>
        </form>
      </section>
    </main>
  )
}

export default AddCreditPage

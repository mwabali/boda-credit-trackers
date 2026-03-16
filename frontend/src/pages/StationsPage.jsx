import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import stationsIcon from '../assets/Stations_icon.svg'
import StatusToast from '../components/StatusToast'
import StationList from '../components/StationList'
import { request } from '../lib/api'
import { getStationDisplayName } from '../lib/mappers'
import styles from './StationsPage.module.css'

const initialStationValues = {
  name: '',
  location: '',
  managerName: '',
  managerPhone: '',
}

function formatStationId(id) {
  return `FS${String(id).padStart(3, '0')}`
}

function StationsPage() {
  const [stations, setStations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isFormExpanded, setIsFormExpanded] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const loadStations = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')
      const payload = await request('/stations')
      setStations(payload.data || [])
      setIsFormExpanded((payload.data || []).length === 0)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStations()
  }, [loadStations])

  const activeStations = useMemo(
    () => stations.filter((station) => station.status === 'active').length,
    [stations]
  )

  const stationsWithManagers = useMemo(
    () => stations.filter((station) => station.managerPhone).length,
    [stations]
  )

  const stationListRows = useMemo(
    () =>
      stations.map((station) => ({
        ...station,
        phone: station.managerPhone || '--',
      })),
    [stations]
  )

  const handleStatusChange = async (stationId, status) => {
    try {
      setIsUpdatingStatus(true)
      setError('')

      await request(`/stations/${stationId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })

      await loadStations()
    } catch (updateError) {
      setError(updateError.message)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const validationSchema = useMemo(
    () =>
      Yup.object({
        name: Yup.string()
          .trim()
          .min(2, 'Branch name must be at least 2 characters')
          .required('Branch name is required'),
        location: Yup.string()
          .trim()
          .min(2, 'Location must be at least 2 characters')
          .required('Location is required'),
        managerName: Yup.string()
          .trim()
          .min(2, 'Manager name must be at least 2 characters')
          .nullable(),
        managerPhone: Yup.string()
          .trim()
          .matches(/^\+?[0-9]{10,15}$/, {
            message: 'Use a valid phone number like +254712345678',
            excludeEmptyString: true,
          }),
      }),
    []
  )

  const formik = useFormik({
    initialValues: initialStationValues,
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        setIsSubmitting(true)
        setError('')
        setSuccessMessage('')

        const payload = {
          name: values.name.trim(),
          location: values.location.trim(),
          managerName: values.managerName.trim(),
          managerPhone: values.managerPhone.trim(),
        }

        await request('/stations', {
          method: 'POST',
          body: JSON.stringify(payload),
        })

        await loadStations()
        resetForm()
        setSuccessMessage('Station added successfully.')
        setIsFormExpanded(false)
      } catch (submitError) {
        setError(submitError.message)
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  const showFieldError = (fieldName) =>
    formik.touched[fieldName] && formik.errors[fieldName]

  return (
    <main className={styles.page}>
      <StatusToast message={error} onClose={() => setError('')} />

      <header className={styles.header}>
        <h1 className={styles.title}>Fuel Stations Network</h1>
        <p className={styles.description}>
          Live station directory backed by the current backend station records.
        </p>
      </header>

      <section className={styles.statsGrid} aria-label="Station summary">
        <article className={styles.statCard}>
          <h2>Total Stations</h2>
          <div className={styles.metricRow}>
            <img
              src={stationsIcon}
              alt=""
              aria-hidden="true"
              className={`${styles.metricIcon} ${styles.totalIcon}`}
            />
            <p className={styles.statValue}>{stations.length}</p>
          </div>
          <span className={styles.statMeta}>registered partner locations</span>
        </article>
        <article className={styles.statCard}>
          <h2>Active Stations</h2>
          <div className={styles.metricRow}>
            <img
              src={stationsIcon}
              alt=""
              aria-hidden="true"
              className={`${styles.metricIcon} ${styles.activeIcon}`}
            />
            <p className={styles.statValue}>{activeStations}</p>
          </div>
          <span className={styles.statMeta}>currently serving riders</span>
        </article>
        <article className={`${styles.statCard} ${styles.statCardWide}`}>
          <h2>Management Phonelines</h2>
          <div className={styles.metricRow}>
            <img
              src={stationsIcon}
              alt=""
              aria-hidden="true"
              className={`${styles.metricIcon} ${styles.contactIcon}`}
            />
            <p className={styles.statValue}>{stationsWithManagers}</p>
          </div>
          <span className={styles.statMeta}>stations with phonelines recorded</span>
        </article>
      </section>

      <section className={styles.formSection} aria-label="Add station">
        <div className={styles.formHeader}>
          <div className={styles.formIntro}>
            <h2 className={styles.formTitle}>Add a Station</h2>
            <p className={styles.formDescription}>
              Create a station here so it becomes available immediately in the Add
              Credit form.
            </p>
          </div>
          <button
            type="button"
            className={styles.toggleButton}
            aria-expanded={isFormExpanded}
            aria-controls="station-entry-form"
            onClick={() => setIsFormExpanded((prev) => !prev)}
          >
            {isFormExpanded ? 'Hide form' : 'Add station'}
          </button>
        </div>

        {successMessage ? <p className={styles.successMessage}>{successMessage}</p> : null}

        {isFormExpanded ? (
          <form
            id="station-entry-form"
            className={styles.stationForm}
            onSubmit={formik.handleSubmit}
          >
            <label className={styles.field}>
              Branch Name
              <input
                type="text"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. Kampala Road"
                className={showFieldError('name') ? styles.fieldInputError : ''}
              />
              {showFieldError('name') ? (
                <span className={styles.fieldError}>{formik.errors.name}</span>
              ) : null}
            </label>

            <label className={styles.field}>
              Location
              <input
                type="text"
                name="location"
                value={formik.values.location}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. Nairobi CBD"
                className={showFieldError('location') ? styles.fieldInputError : ''}
              />
              {showFieldError('location') ? (
                <span className={styles.fieldError}>{formik.errors.location}</span>
              ) : null}
            </label>

            <label className={styles.field}>
              Manager Name
              <input
                type="text"
                name="managerName"
                value={formik.values.managerName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Optional"
                className={showFieldError('managerName') ? styles.fieldInputError : ''}
              />
              {showFieldError('managerName') ? (
                <span className={styles.fieldError}>{formik.errors.managerName}</span>
              ) : null}
            </label>

            <label className={styles.field}>
              Management Phoneline
              <input
                type="tel"
                name="managerPhone"
                value={formik.values.managerPhone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="+254 7xx xxx xxx"
                className={showFieldError('managerPhone') ? styles.fieldInputError : ''}
              />
              {showFieldError('managerPhone') ? (
                <span className={styles.fieldError}>{formik.errors.managerPhone}</span>
              ) : null}
            </label>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Add Station'}
            </button>
          </form>
        ) : null}
      </section>

      <section className={styles.cardsGrid} aria-label="Station cards">
        {isLoading ? <p className={styles.stateMessage}>Loading stations...</p> : null}
        {!isLoading && !error && !stations.length ? (
          <p className={styles.stateMessage}>No stations available.</p>
        ) : null}

        {!isLoading && !error
          ? stations.map((station) => (
              <article key={station.id} className={styles.stationCard}>
                <h2>
                  {formatStationId(station.id)} <span>{getStationDisplayName(station)}</span>
                </h2>
                <ul>
                  <li>
                    <strong>Location:</strong> {station.location}
                  </li>
                  <li>
                    <strong>Manager:</strong> {station.managerName || 'Not assigned'}
                  </li>
                  <li>
                    <strong>Management phoneline:</strong> {station.managerPhone || '--'}
                  </li>
                  <li className={styles.statusRow}>
                    <strong>Status:</strong>
                    <select
                      className={`${styles.statusSelect} ${styles[station.status]}`}
                      value={station.status}
                      onChange={(event) =>
                        handleStatusChange(station.id, event.target.value)
                      }
                      disabled={isUpdatingStatus}
                      aria-label={`Update ${station.name} status`}
                    >
                      <option value="active">Active</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="closed">Closed</option>
                    </select>
                  </li>
                </ul>
              </article>
            ))
          : null}
      </section>

      <div className={styles.listSection}>
        <div>
          <h2 className={styles.listHeading}>Station directory</h2>
          <p className={styles.listDescription}>
            Track the active stations in a tabular view for quick reference.
          </p>
        </div>
        <StationList stations={stationListRows} />
      </div>
    </main>
  )
}

export default StationsPage

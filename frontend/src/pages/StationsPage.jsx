import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useAuth } from '../auth/AuthProvider'
import stationsIcon from '../assets/Stations_icon.svg'
import StationList from '../components/StationList'
import { useToast } from '../components/ToastProvider'
import { request } from '../lib/api'
import { getStationDisplayName } from '../lib/mappers'
import styles from './StationsPage.module.css'

const initialStationValues = {
  name: '',
  location: '',
}

function formatStationId(id) {
  return `FS${String(id).padStart(3, '0')}`
}

function StationsPage() {
  const { user } = useAuth()
  const { showError, showSuccess } = useToast()
  const [stations, setStations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isFormExpanded, setIsFormExpanded] = useState(true)
  const [editingStationId, setEditingStationId] = useState(null)
  const [error, setError] = useState('')

  const loadStations = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')
      const payload = await request('/stations')
      setStations(payload.data || [])
      setIsFormExpanded((currentExpanded) =>
        editingStationId ? currentExpanded : (payload.data || []).length === 0
      )
    } catch (loadError) {
      setError(loadError.message)
      showError(loadError.message)
    } finally {
      setIsLoading(false)
    }
  }, [editingStationId, showError])

  useEffect(() => {
    loadStations()
  }, [loadStations])

  const activeStations = useMemo(
    () => stations.filter((station) => station.status === 'active').length,
    [stations]
  )

  const primaryStation = stations[0] || null
  const stationsWithManagers = useMemo(
    () => stations.filter((station) => station.managerName).length,
    [stations]
  )

  const stationStatusLabel = useMemo(() => {
    if (!primaryStation?.status) {
      return 'Unknown'
    }

    return primaryStation.status.charAt(0).toUpperCase() + primaryStation.status.slice(1)
  }, [primaryStation?.status])

  const stationManagerAssigned = useMemo(
    () => Boolean(primaryStation?.managerName || user?.fullName),
    [primaryStation?.managerName, user?.fullName]
  )

  const stationLocationParts = useMemo(() => {
    if (!primaryStation?.location) {
      return []
    }

    return primaryStation.location
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
  }, [primaryStation?.location])

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

      showSuccess('Station status updated successfully.', 'Status updated')
      await loadStations()
    } catch (updateError) {
      setError(updateError.message)
      showError(updateError.message)
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

        const payload = {
          name: values.name.trim(),
          location: values.location.trim(),
        }

        await request(editingStationId ? `/stations/${editingStationId}` : '/stations', {
          method: editingStationId ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        })

        await loadStations()
        resetForm()
        setEditingStationId(null)
        showSuccess(
          editingStationId ? 'Station details updated successfully.' : 'Station added successfully.',
          editingStationId ? 'Station updated' : 'Station saved'
        )
        setIsFormExpanded(false)
      } catch (submitError) {
        setError(submitError.message)
        showError(submitError.message)
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  const showFieldError = (fieldName) =>
    formik.touched[fieldName] && formik.errors[fieldName]

  const canManageStations = user?.role === 'company'
  const canToggleStatus = user?.role === 'company'

  const startEditingStation = (station) => {
    setEditingStationId(station.id)
    formik.resetForm({
      values: {
        name: station.name || '',
        location: station.location || '',
      },
    })
    setIsFormExpanded(true)
  }

  const stopEditingStation = () => {
    setEditingStationId(null)
    formik.resetForm({ values: initialStationValues })
    setIsFormExpanded(stations.length === 0)
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          {user?.role === 'station' ? 'My Station' : 'Fuel Stations Network'}
        </h1>
        <p className={styles.description}>
          {user?.role === 'station'
            ? 'Keep your branch details accurate, confirm the station is open for requests, and make sure riders are seeing the right location information.'
            : 'Live station directory backed by the current backend station records.'}
        </p>
      </header>

      <section className={styles.statsGrid} aria-label="Station summary">
        {user?.role === 'station' ? (
          <>
            <article className={styles.statCard}>
              <h2>Linked Station</h2>
              <div className={styles.metricRow}>
                <img
                  src={stationsIcon}
                  alt=""
                  aria-hidden="true"
                  className={`${styles.metricIcon} ${styles.totalIcon}`}
                />
                <p className={styles.statValue}>{primaryStation ? 1 : 0}</p>
              </div>
              <span className={styles.statMeta}>station profile connected to your account</span>
            </article>
            <article className={styles.statCard}>
              <h2>Operating Status</h2>
              <div className={styles.metricRow}>
                <img
                  src={stationsIcon}
                  alt=""
                  aria-hidden="true"
                  className={`${styles.metricIcon} ${styles.activeIcon}`}
                />
                <p className={styles.statValueSmall}>{stationStatusLabel}</p>
              </div>
              <span className={styles.statMeta}>
                {primaryStation?.status === 'active'
                  ? 'this branch can currently receive rider credit requests'
                  : 'check this status with your company admin if branch access looks restricted'}
              </span>
            </article>
            <article className={`${styles.statCard} ${styles.statCardWide}`}>
              <h2>Profile Readiness</h2>
              <div className={styles.metricRow}>
                <img
                  src={stationsIcon}
                  alt=""
                  aria-hidden="true"
                  className={`${styles.metricIcon} ${styles.contactIcon}`}
                />
                <p className={styles.statValueSmall}>
                  {stationManagerAssigned ? 'Assigned' : 'Incomplete'}
                </p>
              </div>
              <span className={styles.statMeta}>
                {stationLocationParts.length
                  ? `Location on record: ${stationLocationParts.join(' • ')}`
                  : 'Station location still needs to be confirmed for riders'}
              </span>
            </article>
          </>
        ) : (
          <>
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
          </>
        )}
      </section>

      {canManageStations ? (
      <section className={styles.formSection} aria-label="Add station">
        <div className={styles.formHeader}>
          <div className={styles.formIntro}>
            <h2 className={styles.formTitle}>
              {editingStationId ? 'Edit Station' : 'Add a Station'}
            </h2>
            <p className={styles.formDescription}>
              {editingStationId
                ? 'Update this station profile for your company. Changes stay restricted to stations under your organization.'
                : 'Enlist a station under your company. A station manager can later claim it through the station portal and await approval.'}
            </p>
          </div>
          <button
            type="button"
            className={styles.toggleButton}
            aria-expanded={isFormExpanded}
            aria-controls="station-entry-form"
            onClick={() => {
              if (isFormExpanded && editingStationId) {
                stopEditingStation()
                return
              }

              setIsFormExpanded((prev) => !prev)
            }}
          >
            {isFormExpanded ? (editingStationId ? 'Cancel edit' : 'Hide form') : 'Add station'}
          </button>
        </div>

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

            <div className={styles.formNote}>
              Manager details are assigned from the real station manager account after
              signup and company approval.
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Saving...'
                : editingStationId
                  ? 'Save changes'
                  : 'Add Station'}
            </button>
            {editingStationId ? (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={stopEditingStation}
              >
                Cancel
              </button>
            ) : null}
          </form>
        ) : null}
      </section>
      ) : null}

      <section className={styles.cardsGrid} aria-label="Station cards">
        {isLoading ? <p className={styles.stateMessage}>Loading stations...</p> : null}
        {!isLoading && !error && !stations.length ? (
          <p className={styles.stateMessage}>No stations available.</p>
        ) : null}

        {!isLoading && !error
          ? stations.map((station) => (
              <article key={station.id} className={styles.stationCard}>
                <div className={styles.cardHeader}>
                  <h2>
                    {formatStationId(station.id)} <span>{getStationDisplayName(station)}</span>
                  </h2>
                  {canManageStations ? (
                    <button
                      type="button"
                      className={styles.editButton}
                      onClick={() => startEditingStation(station)}
                    >
                      Edit
                    </button>
                  ) : null}
                </div>
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
                    {canToggleStatus ? (
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
                    ) : (
                      <span className={`${styles.statusSelect} ${styles[station.status]}`}>
                        {station.status}
                      </span>
                    )}
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

import { useMemo } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { getStationDisplayName } from '../lib/mappers'
import styles from './CreditForm.module.css'

const initialValues = {
  riderMode: 'existing',
  riderId: '',
  riderName: '',
  stationId: '',
  amount: '',
  litres: '',
  number_plate: '',
  phone: '',
}

const phonePattern = /^\+?[0-9]{10,15}$/

function formatStationOptionLabel(station) {
  const label = getStationDisplayName(station)
  return label.length > 40 ? `${label.slice(0, 37).trim()}...` : label
}

function CreditForm({
  riders = [],
  stations = [],
  onSubmit,
  submitLabel = 'Save Credit',
  isSubmitting = false,
  lockedRider = null,
}) {
  const hasStations = stations.length > 0
  const isLockedToRider = Boolean(lockedRider?.id)
  const defaultRiderName = lockedRider?.name || ''
  const defaultRiderPhone = lockedRider?.phone || ''
  const defaultRiderPlate = lockedRider?.licensePlate || lockedRider?.number_plate || ''

  const validationSchema = useMemo(
    () =>
      Yup.object({
        riderMode: Yup.string().oneOf(['existing', 'new']).required(),
        riderId: Yup.string().when('riderMode', {
          is: 'existing',
          then: (schema) => schema.required('Please select an existing rider'),
          otherwise: (schema) => schema.notRequired(),
        }),
        riderName: Yup.string().when('riderMode', {
          is: 'new',
          then: (schema) =>
            schema
              .trim()
              .min(2, 'Rider name must be at least 2 characters')
              .required('New rider name is required'),
          otherwise: (schema) => schema.notRequired(),
        }),
        number_plate: Yup.string().when('riderMode', {
          is: 'new',
          then: (schema) =>
            schema
              .trim()
              .min(5, 'Number plate must be at least 5 characters')
              .required('Number plate is required'),
          otherwise: (schema) => schema.notRequired(),
        }),
        phone: Yup.string().when('riderMode', {
          is: 'new',
          then: (schema) =>
            schema
              .matches(phonePattern, 'Use a valid phone number like +254712345678')
              .required('Phone number is required'),
          otherwise: (schema) => schema.notRequired(),
        }),
        stationId: Yup.string().required('Station is required'),
        amount: Yup.number()
          .typeError('Amount must be a number')
          .positive('Amount must be greater than 0')
          .required('Amount is required'),
        litres: Yup.number()
          .typeError('Litres must be a number')
          .positive('Litres must be greater than 0')
          .required('Litres are required'),
      }),
    []
  )

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      ...initialValues,
      riderMode: isLockedToRider ? 'existing' : initialValues.riderMode,
      riderId: isLockedToRider ? String(lockedRider.id) : initialValues.riderId,
      riderName: isLockedToRider ? defaultRiderName : initialValues.riderName,
      number_plate: isLockedToRider ? defaultRiderPlate : initialValues.number_plate,
      phone: isLockedToRider ? defaultRiderPhone : initialValues.phone,
    },
    validationSchema,
    validate: () => {
      const errors = {}

      if (!hasStations) {
        errors.stationId = 'Add at least one station before creating a credit entry'
      }

      return errors
    },
    onSubmit: async (values, { resetForm }) => {
      const payload =
        isLockedToRider || values.riderMode === 'existing'
          ? {
              riderMode: 'existing',
              riderId: Number(values.riderId),
              number_plate: values.number_plate,
              phone: values.phone,
              stationId: Number(values.stationId),
              amount: Number(values.amount),
              liters: Number(values.litres),
            }
          : {
              riderMode: values.riderMode,
              newRider: {
                name: values.riderName,
                phone: values.phone,
                licensePlate: values.number_plate,
              },
              stationId: Number(values.stationId),
              amount: Number(values.amount),
              liters: Number(values.litres),
            }

      if (typeof onSubmit === 'function') {
        await onSubmit(payload)
      }

      resetForm({
        values: {
          ...initialValues,
          riderMode: isLockedToRider ? 'existing' : initialValues.riderMode,
          riderId: isLockedToRider ? String(lockedRider.id) : initialValues.riderId,
          riderName: isLockedToRider ? defaultRiderName : initialValues.riderName,
          number_plate: isLockedToRider ? defaultRiderPlate : initialValues.number_plate,
          phone: isLockedToRider ? defaultRiderPhone : initialValues.phone,
        },
      })
    },
  })

  const showFieldError = (fieldName) =>
    formik.touched[fieldName] && formik.errors[fieldName]

  const handleRiderModeChange = (event) => {
    const nextMode = event.target.value

    formik.setValues({
      ...initialValues,
      riderMode: nextMode,
      stationId: formik.values.stationId,
      amount: formik.values.amount,
      litres: formik.values.litres,
    })

    formik.setTouched({})
  }

  const handleRiderSelectionChange = (event) => {
    const selectedValue = event.target.value
    const selectedRider = riders.find((rider) => String(rider.id) === selectedValue)

    formik.setValues({
      ...formik.values,
      riderId: selectedValue,
      number_plate: selectedRider?.licensePlate || selectedRider?.number_plate || '',
      phone: selectedRider?.phone || selectedRider?.phone_number || '',
    })
  }

  return (
    <section className={styles.wrapper} aria-label="Credit entry form">
      <form className={styles.form} onSubmit={formik.handleSubmit}>
        {!hasStations ? (
          <p className={styles.alert}>
            No stations are available yet. Add a station first before recording credit.
          </p>
        ) : null}

        {!isLockedToRider ? (
          <fieldset className={styles.modeGroup}>
            <legend>Rider entry</legend>
            <label className={styles.modeOption}>
              <input
                type="radio"
                name="riderMode"
                value="existing"
                checked={formik.values.riderMode === 'existing'}
                onChange={handleRiderModeChange}
              />
              Existing rider
            </label>
            <label className={styles.modeOption}>
              <input
                type="radio"
                name="riderMode"
                value="new"
                checked={formik.values.riderMode === 'new'}
                onChange={handleRiderModeChange}
              />
              New rider
            </label>
          </fieldset>
        ) : null}

        {isLockedToRider ? (
          <label className={styles.field} htmlFor="riderName">
            Rider
            <input id="riderName" name="riderName" type="text" value={defaultRiderName} autoComplete="name" readOnly />
          </label>
        ) : formik.values.riderMode === 'existing' ? (
          <label className={styles.field} htmlFor="riderId">
            Rider
            <select
              id="riderId"
              name="riderId"
              value={formik.values.riderId}
              onChange={handleRiderSelectionChange}
              onBlur={formik.handleBlur}
              className={showFieldError('riderId') ? styles.fieldInputError : ''}
              autoComplete="off"
            >
              <option value="">Select rider</option>
              {riders.map((rider) => (
                <option key={rider.id} value={rider.id}>
                  {rider.name}
                </option>
              ))}
            </select>
            {showFieldError('riderId') ? (
              <span className={styles.fieldError}>{formik.errors.riderId}</span>
            ) : null}
          </label>
        ) : (
          <label className={styles.field} htmlFor="riderName">
            Rider Name
            <input
              id="riderName"
              name="riderName"
              type="text"
              value={formik.values.riderName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Enter new rider name"
              className={showFieldError('riderName') ? styles.fieldInputError : ''}
              autoComplete="name"
            />
            {showFieldError('riderName') ? (
              <span className={styles.fieldError}>{formik.errors.riderName}</span>
            ) : null}
          </label>
        )}

        <label className={styles.field} htmlFor="number_plate">
          Number Plate
          <input
            id="number_plate"
            name="number_plate"
            type="text"
            value={formik.values.number_plate}
            readOnly={formik.values.riderMode === 'existing'}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder={
              isLockedToRider || formik.values.riderMode === 'existing'
                ? 'Auto-filled from rider'
                : 'Enter rider number plate'
            }
            className={showFieldError('number_plate') ? styles.fieldInputError : ''}
            autoComplete="off"
          />
          {showFieldError('number_plate') ? (
            <span className={styles.fieldError}>{formik.errors.number_plate}</span>
          ) : null}
        </label>

        <label className={styles.field} htmlFor="phone">
          Phone Number
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formik.values.phone}
            readOnly={formik.values.riderMode === 'existing'}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder={
              isLockedToRider || formik.values.riderMode === 'existing'
                ? 'Auto-filled from rider'
                : '+254712345678'
            }
            className={showFieldError('phone') ? styles.fieldInputError : ''}
            autoComplete="tel"
          />
          {showFieldError('phone') ? (
            <span className={styles.fieldError}>{formik.errors.phone}</span>
          ) : null}
        </label>

        <label className={styles.field} htmlFor="stationId">
          Station
          <select
            id="stationId"
            name="stationId"
            value={formik.values.stationId}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={!hasStations}
            className={showFieldError('stationId') ? styles.fieldInputError : ''}
            autoComplete="off"
          >
            <option value="">Select station</option>
            {stations.map((station) => (
              <option key={station.id} value={station.id} title={getStationDisplayName(station)}>
                {formatStationOptionLabel(station)}
              </option>
            ))}
          </select>
          {showFieldError('stationId') ? (
            <span className={styles.fieldError}>{formik.errors.stationId}</span>
          ) : null}
        </label>

        <label className={styles.field} htmlFor="amount">
          Amount
          <input
            id="amount"
            name="amount"
            type="number"
            min="0"
            value={formik.values.amount}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="e.g. 1500"
            className={showFieldError('amount') ? styles.fieldInputError : ''}
            autoComplete="off"
          />
          {showFieldError('amount') ? (
            <span className={styles.fieldError}>{formik.errors.amount}</span>
          ) : null}
        </label>

        <label className={styles.field} htmlFor="litres">
          Litres
          <input
            id="litres"
            name="litres"
            type="number"
            min="0"
            step="0.1"
            value={formik.values.litres}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="e.g. 5"
            className={showFieldError('litres') ? styles.fieldInputError : ''}
            autoComplete="off"
          />
          {showFieldError('litres') ? (
            <span className={styles.fieldError}>{formik.errors.litres}</span>
          ) : null}
        </label>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSubmitting || !hasStations}
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </form>
    </section>
  )
}

export default CreditForm

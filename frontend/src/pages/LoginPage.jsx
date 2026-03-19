import { useEffect, useMemo, useRef, useState } from 'react'
import { useFormik } from 'formik'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import * as Yup from 'yup'
import logo from '../assets/Boda_Credit_logo.svg'
import { useAuth } from '../auth/AuthProvider'
import { useToast } from '../components/ToastProvider'
import { request } from '../lib/api'
import styles from './LoginPage.module.css'

const PORTALS = [
  {
    role: 'company',
    eyebrow: 'Company portal',
    title: 'Company access',
    description: 'Monitor company-wide performance, stations, riders, and credit activity.',
  },
  {
    role: 'station',
    eyebrow: 'Station portal',
    title: 'Station access',
    description: 'Manage your station location, record credit, and track branch activity.',
  },
  {
    role: 'rider',
    eyebrow: 'Rider portal',
    title: 'Rider access',
    description: 'Check your balances and recent credit activity from your phone.',
  },
]

function LoginPage() {
  const { isAuthenticated, login, register } = useAuth()
  const { showError, showSuccess } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeRole, setActiveRole] = useState('company')
  const [activeMode, setActiveMode] = useState('login')
  const [portalOptions, setPortalOptions] = useState({ companies: ['Total'], stations: [] })
  const [isLoadingPortalOptions, setIsLoadingPortalOptions] = useState(true)
  const [showAuthorityModal, setShowAuthorityModal] = useState(false)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false)
  const authorityConfirmedRef = useRef(false)

  const selectedPortal = useMemo(
    () => PORTALS.find((portal) => portal.role === activeRole) || PORTALS[0],
    [activeRole]
  )

  useEffect(() => {
    let isMounted = true

    async function loadPortalOptions() {
      try {
        setIsLoadingPortalOptions(true)
        const payload = await request('/auth/portal-options')
        if (isMounted) {
          setPortalOptions(payload.data || { companies: ['Total'], stations: [] })
        }
      } catch (error) {
        if (isMounted) {
          showError(error.message, 'Unable to load portal options')
        }
      } finally {
        if (isMounted) {
          setIsLoadingPortalOptions(false)
        }
      }
    }

    loadPortalOptions()

    return () => {
      isMounted = false
    }
  }, [showError])

  const loginFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Enter a valid email').required('Email is required'),
      password: Yup.string().required('Password is required'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const sessionUser = await login(values.email, values.password)
        if (sessionUser?.role === 'station' && sessionUser?.approvalStatus !== 'approved') {
          showSuccess(
            'You are signed in. Your station access is still waiting for approval.',
            'Approval pending'
          )
          navigate('/notifications', { replace: true })
        } else {
          showSuccess('You have signed in successfully.', `Welcome to ${selectedPortal.title}`)
          navigate(location.state?.from?.pathname || '/home', { replace: true })
        }
        return sessionUser
      } catch (error) {
        showError(error.message)
      } finally {
        setSubmitting(false)
      }
    },
  })

  const signupFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      fullName: '',
      companyName: '',
      stationName: '',
      stationLocation: '',
      email: '',
      password: '',
      confirmPassword: '',
      stationId: '',
      phone: '',
      licensePlate: '',
    },
    validationSchema: Yup.object({
      fullName: Yup.string().trim().required('Full name is required'),
      companyName: Yup.string().when([], {
        is: () => activeRole === 'station' || activeRole === 'company',
        then: (schema) => schema.required('Company is required'),
        otherwise: (schema) => schema.notRequired(),
      }),
      stationName: Yup.string().when([], {
        is: () => activeRole === 'company',
        then: (schema) => schema.trim().required('First station name is required'),
        otherwise: (schema) => schema.notRequired(),
      }),
      stationLocation: Yup.string().when([], {
        is: () => activeRole === 'company',
        then: (schema) => schema.trim().required('Station location is required'),
        otherwise: (schema) => schema.notRequired(),
      }),
      email: Yup.string().email('Enter a valid email').required('Email is required'),
      password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Please confirm your password'),
      stationId: Yup.string().when([], {
        is: () => activeRole === 'station',
        then: (schema) => schema.required('Station is required'),
        otherwise: (schema) => schema.notRequired(),
      }),
      phone: Yup.string().when([], {
        is: () => activeRole === 'rider',
        then: (schema) => schema.trim().required('Phone number is required'),
        otherwise: (schema) => schema.notRequired(),
      }),
      licensePlate: Yup.string().when([], {
        is: () => activeRole === 'rider',
        then: (schema) => schema.trim().required('Number plate is required'),
        otherwise: (schema) => schema.notRequired(),
      }),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const payload = {
          role: activeRole,
          fullName: values.fullName,
          companyName: activeRole === 'rider' ? 'Total' : values.companyName.trim(),
          email: values.email,
          password: values.password,
        }

        if (activeRole === 'company') {
          if (!authorityConfirmedRef.current) {
            setShowAuthorityModal(true)
            setSubmitting(false)
            return
          }
          payload.stationName = values.stationName
          payload.stationLocation = values.stationLocation
          payload.authorityConfirmed = true
        }

        if (activeRole === 'station') {
          payload.stationId = Number(values.stationId)
        }

        if (activeRole === 'rider') {
          payload.phone = values.phone
          payload.licensePlate = values.licensePlate
        }

        const sessionUser = await register(payload)
        if (sessionUser?.role === 'station' && sessionUser?.approvalStatus !== 'approved') {
          showSuccess(
            'Your station manager account has been created and is now awaiting company approval.',
            'Approval pending'
          )
          navigate('/notifications', { replace: true })
        } else {
          showSuccess(
            'Your account has been created successfully.',
            `${selectedPortal.title} ready`
          )
          navigate('/home', { replace: true })
        }
      } catch (error) {
        showError(error.message)
      } finally {
        authorityConfirmedRef.current = false
        setSubmitting(false)
      }
    },
  })

  useEffect(() => {
    loginFormik.resetForm()
    signupFormik.resetForm({
      values: {
        fullName: '',
        companyName: activeRole === 'station' ? portalOptions.companies[0] || '' : '',
        stationName: '',
        stationLocation: '',
        email: '',
        password: '',
        confirmPassword: '',
        stationId: '',
        phone: '',
        licensePlate: '',
      },
    })
    setShowAuthorityModal(false)
    authorityConfirmedRef.current = false
  }, [activeRole, portalOptions.companies]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeRole === 'station' && !signupFormik.values.companyName && portalOptions.companies[0]) {
      signupFormik.setFieldValue('companyName', portalOptions.companies[0], false)
    }
  }, [activeRole, portalOptions.companies, signupFormik])

  const stationsForSelectedCompany = portalOptions.stations.filter(
    (station) => station.companyName === signupFormik.values.companyName
  )

  if (isAuthenticated) {
    return <Navigate to="/home" replace />
  }

  const confirmAuthorityAndSubmit = async () => {
    setShowAuthorityModal(false)
    authorityConfirmedRef.current = true
    await signupFormik.submitForm()
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.brandPanel}>
          <img src={logo} alt="Boda Credit" className={styles.logo} />

          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Secure access</p>
            <h1>Choose your portal</h1>
            <p>Select the workspace that matches how you use Boda Credit.</p>
          </div>

          <div className={styles.portalGrid}>
            {PORTALS.map((portal) => (
              <button
                key={portal.role}
                type="button"
                className={`${styles.portalCard} ${
                  activeRole === portal.role ? styles.portalCardActive : ''
                }`}
                onClick={() => setActiveRole(portal.role)}
              >
                <span className={styles.portalEyebrow}>{portal.eyebrow}</span>
                <strong>{portal.title}</strong>
                <span>{portal.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <p className={styles.formTag}>{selectedPortal.eyebrow}</p>
            <h2>{selectedPortal.title}</h2>
            <p>
              {activeMode === 'login'
                ? 'Sign in with your registered account details.'
                : 'Create your account to start using this portal.'}
            </p>
            <div className={styles.infoAlert}>
              <strong>Beta stage password note</strong>
              <span>
                Password reset is still limited during testing. Save the password you create in
                your browser or password manager so you can sign back in easily.
              </span>
            </div>
          </div>

          <div className={styles.modeSwitch}>
            <button
              type="button"
              className={activeMode === 'login' ? styles.modeButtonActive : styles.modeButton}
              onClick={() => setActiveMode('login')}
            >
              Sign in
            </button>
            <button
              type="button"
              className={activeMode === 'signup' ? styles.modeButtonActive : styles.modeButton}
              onClick={() => setActiveMode('signup')}
            >
              Create account
            </button>
          </div>

          {activeMode === 'login' ? (
            <form className={styles.formFields} onSubmit={loginFormik.handleSubmit}>
              <label className={styles.field}>
                Email
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={loginFormik.values.email}
                  onChange={loginFormik.handleChange}
                  onBlur={loginFormik.handleBlur}
                  placeholder="name@example.com"
                  autoComplete="username"
                />
                {loginFormik.touched.email && loginFormik.errors.email ? (
                  <span className={styles.errorText}>{loginFormik.errors.email}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                Password
                <div className={styles.passwordField}>
                  <input
                    id="password"
                    name="password"
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginFormik.values.password}
                    onChange={loginFormik.handleChange}
                    onBlur={loginFormik.handleBlur}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowLoginPassword((current) => !current)}
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {loginFormik.touched.password && loginFormik.errors.password ? (
                  <span className={styles.errorText}>{loginFormik.errors.password}</span>
                ) : null}
              </label>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={loginFormik.isSubmitting}
              >
                {loginFormik.isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          ) : (
            <form className={styles.formFields} onSubmit={signupFormik.handleSubmit}>
              <label className={styles.field}>
                Full name
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={signupFormik.values.fullName}
                  onChange={signupFormik.handleChange}
                  onBlur={signupFormik.handleBlur}
                  placeholder="Your full name"
                />
                {signupFormik.touched.fullName && signupFormik.errors.fullName ? (
                  <span className={styles.errorText}>{signupFormik.errors.fullName}</span>
                ) : null}
              </label>

              {activeRole === 'company' ? (
                <>
                  <label className={styles.field}>
                    Company name
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      value={signupFormik.values.companyName}
                      onChange={signupFormik.handleChange}
                      onBlur={signupFormik.handleBlur}
                      placeholder="Company legal or trading name"
                    />
                    {signupFormik.touched.companyName && signupFormik.errors.companyName ? (
                      <span className={styles.errorText}>{signupFormik.errors.companyName}</span>
                    ) : null}
                  </label>

                  <div className={styles.fieldRow}>
                    <label className={styles.field}>
                      First station name
                      <input
                        id="stationName"
                        name="stationName"
                        type="text"
                        value={signupFormik.values.stationName}
                        onChange={signupFormik.handleChange}
                        onBlur={signupFormik.handleBlur}
                        placeholder="Buruburu"
                      />
                      {signupFormik.touched.stationName && signupFormik.errors.stationName ? (
                        <span className={styles.errorText}>{signupFormik.errors.stationName}</span>
                      ) : null}
                    </label>

                    <label className={styles.field}>
                      Station location
                      <input
                        id="stationLocation"
                        name="stationLocation"
                        type="text"
                        value={signupFormik.values.stationLocation}
                        onChange={signupFormik.handleChange}
                        onBlur={signupFormik.handleBlur}
                        placeholder="Nairobi, Buruburu"
                      />
                      {signupFormik.touched.stationLocation &&
                      signupFormik.errors.stationLocation ? (
                        <span className={styles.errorText}>
                          {signupFormik.errors.stationLocation}
                        </span>
                      ) : null}
                    </label>
                  </div>

                  <p className={styles.helperText}>
                    Your first station is listed during company onboarding so your team can begin
                    assigning station managers immediately.
                  </p>
                </>
              ) : null}

              {activeRole === 'station' ? (
                <>
                  <label className={styles.field}>
                    Company
                    <select
                      id="companyName"
                      name="companyName"
                      value={signupFormik.values.companyName}
                      onChange={signupFormik.handleChange}
                      onBlur={signupFormik.handleBlur}
                      disabled={isLoadingPortalOptions}
                    >
                      <option value="">Select company</option>
                      {portalOptions.companies.map((companyName) => (
                        <option key={companyName} value={companyName}>
                          {companyName}
                        </option>
                      ))}
                    </select>
                    {signupFormik.touched.companyName && signupFormik.errors.companyName ? (
                      <span className={styles.errorText}>{signupFormik.errors.companyName}</span>
                    ) : null}
                  </label>

                  <label className={styles.field}>
                    Station
                    <select
                      id="stationId"
                      name="stationId"
                      value={signupFormik.values.stationId}
                      onChange={signupFormik.handleChange}
                      onBlur={signupFormik.handleBlur}
                      disabled={isLoadingPortalOptions || stationsForSelectedCompany.length === 0}
                    >
                      <option value="">Select station</option>
                      {stationsForSelectedCompany.map((station) => (
                        <option key={station.id} value={station.id}>
                          {station.displayName}
                        </option>
                      ))}
                    </select>
                    {signupFormik.touched.stationId && signupFormik.errors.stationId ? (
                      <span className={styles.errorText}>{signupFormik.errors.stationId}</span>
                    ) : null}
                  </label>

                  {stationsForSelectedCompany.length === 0 ? (
                    <p className={styles.helperText}>
                      No stations have been listed under this company yet. Ask the company team to
                      create the station first.
                    </p>
                  ) : null}
                </>
              ) : null}

              {activeRole === 'rider' ? (
                <>
                  <label className={styles.field}>
                    Phone number
                    <input
                      id="phone"
                      name="phone"
                      type="text"
                      value={signupFormik.values.phone}
                      onChange={signupFormik.handleChange}
                      onBlur={signupFormik.handleBlur}
                      placeholder="Your active phone number"
                    />
                    {signupFormik.touched.phone && signupFormik.errors.phone ? (
                      <span className={styles.errorText}>{signupFormik.errors.phone}</span>
                    ) : null}
                  </label>

                  <label className={styles.field}>
                    Number plate
                    <input
                      id="licensePlate"
                      name="licensePlate"
                      type="text"
                      value={signupFormik.values.licensePlate}
                      onChange={signupFormik.handleChange}
                      onBlur={signupFormik.handleBlur}
                      placeholder="UAB 123X"
                    />
                    {signupFormik.touched.licensePlate && signupFormik.errors.licensePlate ? (
                      <span className={styles.errorText}>{signupFormik.errors.licensePlate}</span>
                    ) : null}
                  </label>
                </>
              ) : null}

              <label className={styles.field}>
                Email
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={signupFormik.values.email}
                  onChange={signupFormik.handleChange}
                  onBlur={signupFormik.handleBlur}
                  placeholder="name@example.com"
                  autoComplete="username"
                />
                {signupFormik.touched.email && signupFormik.errors.email ? (
                  <span className={styles.errorText}>{signupFormik.errors.email}</span>
                ) : null}
              </label>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  Password
                  <div className={styles.passwordField}>
                    <input
                      id="password"
                      name="password"
                      type={showSignupPassword ? 'text' : 'password'}
                      value={signupFormik.values.password}
                      onChange={signupFormik.handleChange}
                      onBlur={signupFormik.handleBlur}
                      placeholder="Create a password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowSignupPassword((current) => !current)}
                      aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                    >
                      {showSignupPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {signupFormik.touched.password && signupFormik.errors.password ? (
                    <span className={styles.errorText}>{signupFormik.errors.password}</span>
                  ) : null}
                </label>

                <label className={styles.field}>
                  Confirm password
                  <div className={styles.passwordField}>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showSignupConfirmPassword ? 'text' : 'password'}
                      value={signupFormik.values.confirmPassword}
                      onChange={signupFormik.handleChange}
                      onBlur={signupFormik.handleBlur}
                      placeholder="Repeat password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowSignupConfirmPassword((current) => !current)}
                      aria-label={
                        showSignupConfirmPassword
                          ? 'Hide confirmation password'
                          : 'Show confirmation password'
                      }
                    >
                      {showSignupConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {signupFormik.touched.confirmPassword &&
                  signupFormik.errors.confirmPassword ? (
                    <span className={styles.errorText}>
                      {signupFormik.errors.confirmPassword}
                    </span>
                  ) : null}
                </label>
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={signupFormik.isSubmitting}
              >
                {signupFormik.isSubmitting ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          )}
        </div>
      </section>

      {showAuthorityModal ? (
        <div className={styles.modalOverlay} role="presentation">
          <div
            className={styles.modalCard}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="authority-confirmation-title"
            aria-describedby="authority-confirmation-description"
          >
            <p className={styles.modalEyebrow}>Company account confirmation</p>
            <h2 id="authority-confirmation-title" className={styles.modalTitle}>
              Confirm your authority to act for this business
            </h2>
            <p id="authority-confirmation-description" className={styles.modalDescription}>
              By continuing, you confirm that you are duly authorized to create and administer a
              Boda Credit account on behalf of {signupFormik.values.companyName || 'this company'},
              and that the company and station details you have entered are accurate to the best of
              your knowledge.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalSecondaryButton}
                onClick={() => {
                  setShowAuthorityModal(false)
                  authorityConfirmedRef.current = false
                }}
              >
                Go back
              </button>
              <button
                type="button"
                className={styles.modalPrimaryButton}
                onClick={confirmAuthorityAndSubmit}
              >
                I confirm and want to create the account
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}

export default LoginPage

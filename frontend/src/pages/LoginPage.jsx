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
    role: 'sacco',
    eyebrow: 'SACCO portal',
    title: 'SACCO oversight',
    description: 'Monitor member riders, balances, repayments, and fuel-credit activity.',
  },
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

const NEW_COMPANY_VALUE = '__new_company__'

function LoginPage() {
  const { isAuthenticated, login, register } = useAuth()
  const { showError, showSuccess } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeRole, setActiveRole] = useState('company')
  const [activeMode, setActiveMode] = useState('login')
  const [portalOptions, setPortalOptions] = useState({ companies: ['Total'], saccos: [], stations: [] })
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
          setPortalOptions(payload.data || { companies: ['Total'], saccos: [], stations: [] })
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
      newCompanyName: '',
      saccoName: '',
      saccoRegistrationNumber: '',
      saccoContactPhone: '',
      saccoLocation: '',
      saccoId: '',
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
      newCompanyName: Yup.string().when('companyName', {
        is: (companyName) => activeRole === 'company' && companyName === NEW_COMPANY_VALUE,
        then: (schema) => schema.trim().required('New company name is required'),
        otherwise: (schema) => schema.notRequired(),
      }),
      saccoName: Yup.string().when([], {
        is: () => activeRole === 'sacco',
        then: (schema) => schema.trim().required('SACCO name is required'),
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
      saccoId: Yup.string().when([], {
        is: () => activeRole === 'rider',
        then: (schema) => schema.required('SACCO membership is required'),
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
        const selectedCompanyName =
          values.companyName === NEW_COMPANY_VALUE
            ? values.newCompanyName.trim()
            : values.companyName.trim()
        const payload = {
          role: activeRole,
          fullName: values.fullName,
          companyName: activeRole === 'rider' ? 'Total' : selectedCompanyName,
          email: values.email,
          password: values.password,
        }

        if (activeRole === 'company') {
          if (!authorityConfirmedRef.current) {
            setShowAuthorityModal(true)
            setSubmitting(false)
            return
          }
          payload.authorityConfirmed = true
        }

        if (activeRole === 'sacco') {
          payload.saccoName = values.saccoName
          payload.saccoRegistrationNumber = values.saccoRegistrationNumber
          payload.saccoContactPhone = values.saccoContactPhone
          payload.saccoLocation = values.saccoLocation
        }

        if (activeRole === 'station') {
          payload.stationId = Number(values.stationId)
        }

        if (activeRole === 'rider') {
          payload.phone = values.phone
          payload.licensePlate = values.licensePlate
          payload.saccoId = values.saccoId ? Number(values.saccoId) : null
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
        companyName: '',
        newCompanyName: '',
        saccoName: '',
        saccoRegistrationNumber: '',
        saccoContactPhone: '',
        saccoLocation: '',
        saccoId: '',
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
                  autoComplete="name"
                />
                {signupFormik.touched.fullName && signupFormik.errors.fullName ? (
                  <span className={styles.errorText}>{signupFormik.errors.fullName}</span>
                ) : null}
              </label>

              {activeRole === 'company' ? (
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
                      autoComplete="organization"
                    >
                      <option value="">Select company</option>
                      {portalOptions.companies.map((companyName) => (
                        <option key={companyName} value={companyName}>
                          {companyName}
                        </option>
                      ))}
                      <option value={NEW_COMPANY_VALUE}>Add a new company</option>
                    </select>
                    {signupFormik.touched.companyName && signupFormik.errors.companyName ? (
                      <span className={styles.errorText}>{signupFormik.errors.companyName}</span>
                    ) : null}
                  </label>

                  {signupFormik.values.companyName === NEW_COMPANY_VALUE ? (
                    <label className={styles.field}>
                      New company name
                      <input
                        id="newCompanyName"
                        name="newCompanyName"
                        type="text"
                        value={signupFormik.values.newCompanyName}
                        onChange={signupFormik.handleChange}
                        onBlur={signupFormik.handleBlur}
                        placeholder="Company legal or trading name"
                        autoComplete="organization"
                      />
                      {signupFormik.touched.newCompanyName && signupFormik.errors.newCompanyName ? (
                        <span className={styles.errorText}>{signupFormik.errors.newCompanyName}</span>
                      ) : null}
                    </label>
                  ) : null}

                  <p className={styles.helperText}>
                    After signing in, use the Stations page to add your company branches. Station
                    managers can then select a listed branch and request access.
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
                      autoComplete="organization"
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
                      autoComplete="off"
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
                      {signupFormik.values.companyName
                        ? 'No stations have been listed under this company yet. Ask the company admin to create the branch first.'
                        : 'Choose your company first, then select the branch where you work.'}
                    </p>
                  ) : null}
                </>
              ) : null}

              {activeRole === 'sacco' ? (
                <>
                  <label className={styles.field}>
                    SACCO name
                    <input
                      id="saccoName"
                      name="saccoName"
                      type="text"
                      value={signupFormik.values.saccoName}
                      onChange={signupFormik.handleChange}
                      onBlur={signupFormik.handleBlur}
                      placeholder="Rongai Riders SACCO"
                      autoComplete="organization"
                    />
                    {signupFormik.touched.saccoName && signupFormik.errors.saccoName ? (
                      <span className={styles.errorText}>{signupFormik.errors.saccoName}</span>
                    ) : null}
                  </label>

                  <div className={styles.fieldRow}>
                    <label className={styles.field}>
                      Registration number
                      <input
                        id="saccoRegistrationNumber"
                        name="saccoRegistrationNumber"
                        type="text"
                        value={signupFormik.values.saccoRegistrationNumber}
                        onChange={signupFormik.handleChange}
                        placeholder="Optional"
                        autoComplete="off"
                      />
                    </label>
                    <label className={styles.field}>
                      SACCO phone
                      <input
                        id="saccoContactPhone"
                        name="saccoContactPhone"
                        type="tel"
                        value={signupFormik.values.saccoContactPhone}
                        onChange={signupFormik.handleChange}
                        placeholder="+254712345678"
                        autoComplete="tel"
                      />
                    </label>
                  </div>

                  <label className={styles.field}>
                    SACCO location
                    <input
                      id="saccoLocation"
                      name="saccoLocation"
                      type="text"
                      value={signupFormik.values.saccoLocation}
                      onChange={signupFormik.handleChange}
                      placeholder="Rongai, Kajiado"
                      autoComplete="address-level2"
                    />
                  </label>
                </>
              ) : null}

              {activeRole === 'rider' ? (
                <>
                  <label className={styles.field}>
                    SACCO membership
                    <select
                      id="saccoId"
                      name="saccoId"
                      value={signupFormik.values.saccoId}
                      onChange={signupFormik.handleChange}
                      onBlur={signupFormik.handleBlur}
                      disabled={isLoadingPortalOptions}
                      autoComplete="organization"
                    >
                      <option value="">Select your SACCO</option>
                      {portalOptions.saccos.map((sacco) => (
                        <option key={sacco.id} value={sacco.id}>
                          {sacco.name}
                        </option>
                      ))}
                    </select>
                    {signupFormik.touched.saccoId && signupFormik.errors.saccoId ? (
                      <span className={styles.errorText}>{signupFormik.errors.saccoId}</span>
                    ) : null}
                  </label>

                  {!isLoadingPortalOptions && portalOptions.saccos.length === 0 ? (
                    <p className={styles.helperText}>
                      No SACCOs are currently available. Please ask the platform team to add your
                      SACCO before creating a rider account.
                    </p>
                  ) : null}

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
                      autoComplete="tel"
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
                      autoComplete="off"
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

import { useEffect, useMemo, useState } from 'react'
import { useFormik } from 'formik'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import * as Yup from 'yup'
import logo from '../assets/Boda_Credit_logo.svg'
import { useAuth } from '../auth/AuthProvider'
import { useToast } from '../components/ToastProvider'
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
    description: 'Manage one station location, record credit, and track branch activity.',
  },
  {
    role: 'rider',
    eyebrow: 'Rider portal',
    title: 'Rider access',
    description: 'Check your balances, recent credit activity, and approved station network.',
  },
]

function LoginPage() {
  const { isAuthenticated, login, register } = useAuth()
  const { showError, showSuccess } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeRole, setActiveRole] = useState('company')
  const [activeMode, setActiveMode] = useState('login')

  const selectedPortal = useMemo(
    () => PORTALS.find((portal) => portal.role === activeRole) || PORTALS[0],
    [activeRole]
  )

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
        showSuccess('You have signed in successfully.', `Welcome to ${selectedPortal.title}`)
        navigate(location.state?.from?.pathname || '/home', { replace: true })
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
      email: '',
      password: '',
      confirmPassword: '',
      branchName: '',
      location: '',
      managerName: '',
      managementPhoneline: '',
      phone: '',
      licensePlate: '',
    },
    validationSchema: Yup.object({
      fullName: Yup.string().trim().required('Full name is required'),
      email: Yup.string().email('Enter a valid email').required('Email is required'),
      password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Please confirm your password'),
      branchName: Yup.string().when([], {
        is: () => activeRole === 'station',
        then: (schema) => schema.trim().required('Branch name is required'),
        otherwise: (schema) => schema.notRequired(),
      }),
      location: Yup.string().when([], {
        is: () => activeRole === 'station',
        then: (schema) => schema.trim().required('Location is required'),
        otherwise: (schema) => schema.notRequired(),
      }),
      managerName: Yup.string().when([], {
        is: () => activeRole === 'station',
        then: (schema) => schema.trim().required('Manager name is required'),
        otherwise: (schema) => schema.notRequired(),
      }),
      managementPhoneline: Yup.string().when([], {
        is: () => activeRole === 'station',
        then: (schema) => schema.trim().required('Management phoneline is required'),
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
          companyName: 'Total',
          email: values.email,
          password: values.password,
        }

        if (activeRole === 'station') {
          payload.branchName = values.branchName
          payload.location = values.location
          payload.managerName = values.managerName
          payload.managementPhoneline = values.managementPhoneline
        }

        if (activeRole === 'rider') {
          payload.phone = values.phone
          payload.licensePlate = values.licensePlate
        }

        await register(payload)
        showSuccess('Your account has been created successfully.', `${selectedPortal.title} ready`)
        navigate('/home', { replace: true })
      } catch (error) {
        showError(error.message)
      } finally {
        setSubmitting(false)
      }
    },
  })

  useEffect(() => {
    loginFormik.resetForm()
    signupFormik.resetForm({
      values: {
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        branchName: '',
        location: '',
        managerName: '',
        managementPhoneline: '',
        phone: '',
        licensePlate: '',
      },
    })
  }, [activeRole]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isAuthenticated) {
    return <Navigate to="/home" replace />
  }

  const stationOptions = signupOptions.stations.filter((station) => !station.hasAccount)
  const riderOptions = signupOptions.riders.filter((rider) => !rider.hasAccount)

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
                  autoComplete="email"
                />
                {loginFormik.touched.email && loginFormik.errors.email ? (
                  <span className={styles.errorText}>{loginFormik.errors.email}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                Password
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={loginFormik.values.password}
                  onChange={loginFormik.handleChange}
                  onBlur={loginFormik.handleBlur}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
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

              {activeRole === 'station' ? (
                <>
                  <label className={styles.field}>
                    Branch name
                    <input
                      id="branchName"
                      name="branchName"
                      type="text"
                      value={signupFormik.values.branchName}
                      onChange={signupFormik.handleChange}
                      onBlur={signupFormik.handleBlur}
                      placeholder="Buruburu"
                    />
                    {signupFormik.touched.branchName && signupFormik.errors.branchName ? (
                      <span className={styles.errorText}>{signupFormik.errors.branchName}</span>
                    ) : null}
                  </label>

                  <label className={styles.field}>
                    Location
                    <input
                      id="location"
                      name="location"
                      type="text"
                      value={signupFormik.values.location}
                      onChange={signupFormik.handleChange}
                      onBlur={signupFormik.handleBlur}
                      placeholder="Buruburu, Nairobi"
                    />
                    {signupFormik.touched.location && signupFormik.errors.location ? (
                      <span className={styles.errorText}>{signupFormik.errors.location}</span>
                    ) : null}
                  </label>

                  <label className={styles.field}>
                    Manager name
                    <input
                      id="managerName"
                      name="managerName"
                      type="text"
                      value={signupFormik.values.managerName}
                      onChange={signupFormik.handleChange}
                      onBlur={signupFormik.handleBlur}
                      placeholder="Station manager name"
                    />
                    {signupFormik.touched.managerName && signupFormik.errors.managerName ? (
                      <span className={styles.errorText}>{signupFormik.errors.managerName}</span>
                    ) : null}
                  </label>

                  <label className={styles.field}>
                    Management phoneline
                    <input
                      id="managementPhoneline"
                      name="managementPhoneline"
                      type="text"
                      value={signupFormik.values.managementPhoneline}
                      onChange={signupFormik.handleChange}
                      onBlur={signupFormik.handleBlur}
                      placeholder="Station contact number"
                    />
                    {signupFormik.touched.managementPhoneline &&
                    signupFormik.errors.managementPhoneline ? (
                      <span className={styles.errorText}>
                        {signupFormik.errors.managementPhoneline}
                      </span>
                    ) : null}
                  </label>
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
                  autoComplete="email"
                />
                {signupFormik.touched.email && signupFormik.errors.email ? (
                  <span className={styles.errorText}>{signupFormik.errors.email}</span>
                ) : null}
              </label>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  Password
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={signupFormik.values.password}
                    onChange={signupFormik.handleChange}
                    onBlur={signupFormik.handleBlur}
                    placeholder="Create a password"
                    autoComplete="new-password"
                  />
                  {signupFormik.touched.password && signupFormik.errors.password ? (
                    <span className={styles.errorText}>{signupFormik.errors.password}</span>
                  ) : null}
                </label>

                <label className={styles.field}>
                  Confirm password
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={signupFormik.values.confirmPassword}
                    onChange={signupFormik.handleChange}
                    onBlur={signupFormik.handleBlur}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                  />
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
    </main>
  )
}

export default LoginPage

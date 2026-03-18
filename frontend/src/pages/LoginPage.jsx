import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import logo from '../assets/Boda_Credit_logo.svg'
import { useAuth } from '../auth/AuthProvider'
import { useToast } from '../components/ToastProvider'
import styles from './LoginPage.module.css'

function roleHint(role) {
  if (role === 'company') return 'Company access'
  if (role === 'station') return 'Station access'
  return 'Rider access'
}

function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const { showError, showSuccess } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/home" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setIsSubmitting(true)
      const sessionUser = await login(email, password)
      showSuccess(`Signed in as ${roleHint(sessionUser?.role)}.`, 'Welcome back')
      navigate(location.state?.from?.pathname || '/home', { replace: true })
    } catch (error) {
      showError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.brandPanel}>
          <img src={logo} alt="Boda Credit" className={styles.logo} />
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Secure access</p>
            <h1>Sign in to Boda Credit</h1>
            <p>
              Company teams, station reps, and riders each get a focused view of the
              platform with only the data they need.
            </p>
          </div>
        </div>

        <form className={styles.formCard} onSubmit={handleSubmit}>
          <div className={styles.formHeader}>
            <p className={styles.formTag}>Account login</p>
            <h2>Welcome back</h2>
            <p>Use your assigned email and password to continue.</p>
          </div>

          <label className={styles.field}>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className={styles.field}>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>

          <div className={styles.demoPanel}>
            <p className={styles.demoTitle}>Demo role accounts</p>
            <ul>
              <li>
                <strong>Company:</strong> growth.manager@total.co.ke
              </li>
              <li>
                <strong>Station:</strong> eldoret.rep@total.co.ke
              </li>
              <li>
                <strong>Rider:</strong> john.kamau@rider.bodacredit.app
              </li>
            </ul>
          </div>
        </form>
      </section>
    </main>
  )
}

export default LoginPage

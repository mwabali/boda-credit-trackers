import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import logo from '../assets/Boda_Credit_logo.svg'
import styles from './Sidebar.module.css'

function getLinksForRole(user) {
  if (user?.role === 'station' && user?.approvalStatus !== 'approved') {
    return [
      { to: '/notifications', label: 'Notifications' },
      { to: '/profile', label: 'Profile' },
    ]
  }

  const role = user?.role
  if (role === 'company') {
    return [
      { to: '/home', label: 'Dashboard' },
      { to: '/riders', label: 'Riders' },
      { to: '/stations', label: 'Fuel Stations' },
      { to: '/transactions', label: 'Transactions' },
      { to: '/add-credit', label: 'Add Credit' },
      { to: '/notifications', label: 'Notifications' },
      { to: '/profile', label: 'Profile' },
    ]
  }

  if (role === 'station') {
    return [
      { to: '/home', label: 'Dashboard' },
      { to: '/stations', label: 'My Station' },
      { to: '/transactions', label: 'Transactions' },
      { to: '/add-credit', label: 'Add Credit' },
      { to: '/notifications', label: 'Notifications' },
      { to: '/profile', label: 'Profile' },
    ]
  }

  return [
    { to: '/home', label: 'Dashboard' },
    { to: '/transactions', label: 'My Activity' },
    { to: '/stations', label: 'Stations' },
    { to: '/notifications', label: 'Notifications' },
    { to: '/profile', label: 'Profile' },
  ]
}

function Sidebar() {
  const { user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const links = getLinksForRole(user)

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  return (
    <aside className={styles.sidebar}>
      <div className={styles.topBar}>
        <div className={styles.brand}>
          <img src={logo} alt="Boda Credit Tracker logo" className={styles.logo} />
        </div>

        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setIsMenuOpen((current) => !current)}
          aria-expanded={isMenuOpen}
          aria-controls="primary-navigation"
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          <span className={styles.menuButtonText}>Menu</span>
          <span className={styles.menuIcon} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      <nav
        id="primary-navigation"
        className={`${styles.navLinks} ${isMenuOpen ? styles.navLinksOpen : ''}`}
        aria-label="Primary navigation"
      >
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
            }
          >
            {link.label}
          </NavLink>
        ))}

        <div className={styles.accountPanel}>
          <p className={styles.accountRole}>{user?.role || 'Account'}</p>
          <p className={styles.accountName}>{user?.fullName || 'Signed in user'}</p>
          <button type="button" className={styles.logoutButton} onClick={logout}>
            Sign out
          </button>
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar

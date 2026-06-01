import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import logo from '../assets/Boda_Credit_logo.svg'
import { request } from '../lib/api'
import styles from './Sidebar.module.css'

function getLinksForRole(user, notificationCount = 0) {
  if (user?.role === 'station' && user?.approvalStatus !== 'approved') {
    return [
      { to: '/notifications', label: 'Notifications', badge: notificationCount },
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
      { to: '/notifications', label: 'Notifications', badge: notificationCount },
      { to: '/profile', label: 'Profile' },
    ]
  }

  if (role === 'station') {
    return [
      { to: '/home', label: 'Dashboard' },
      { to: '/stations', label: 'My Station' },
      { to: '/transactions', label: 'Transactions' },
      { to: '/riders', label: 'Riders' },
      { to: '/notifications', label: 'Notifications', badge: notificationCount },
      { to: '/profile', label: 'Profile' },
    ]
  }

  if (role === 'sacco') {
    return [
      { to: '/home', label: 'Dashboard' },
      { to: '/saccos', label: 'SACCO Oversight' },
      { to: '/riders', label: 'Member Riders' },
      { to: '/transactions', label: 'Credit Ledger' },
      { to: '/stations', label: 'Fuel Stations' },
      { to: '/notifications', label: 'Notifications', badge: notificationCount },
      { to: '/profile', label: 'Profile' },
    ]
  }

  return [
    { to: '/home', label: 'Dashboard' },
    { to: '/add-credit', label: 'Request Credit' },
    { to: '/transactions', label: 'My Activity' },
    { to: '/stations', label: 'Stations' },
    { to: '/notifications', label: 'Notifications', badge: notificationCount },
    { to: '/profile', label: 'Profile' },
  ]
}

function Sidebar() {
  const { user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  const location = useLocation()
  const links = getLinksForRole(user, notificationCount)

  useEffect(() => {
    let isActive = true

    async function loadNotificationCount() {
      if (!user?.id) {
        setNotificationCount(0)
        return
      }

      try {
        const payload = await request('/notifications')
        if (!isActive) {
          return
        }

        const unreadNotifications =
          payload.data?.notifications?.filter((notification) => !notification.isRead).length || 0
        const pendingApprovals = payload.data?.pendingStationApprovals?.length || 0
        setNotificationCount(unreadNotifications + pendingApprovals)
      } catch {
        if (isActive) {
          setNotificationCount(0)
        }
      }
    }

    loadNotificationCount()

    return () => {
      isActive = false
    }
  }, [location.pathname, user?.id])

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
            onClick={() => setIsMenuOpen(false)}
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
            }
          >
            <span>{link.label}</span>
            {link.badge ? <span className={styles.navBadge}>{link.badge}</span> : null}
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

import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import logo from '../assets/Boda_Credit_logo.svg'
import styles from './Sidebar.module.css'

const links = [
  { to: '/home', label: 'Dashboard' },
  { to: '/riders', label: 'Riders' },
  { to: '/stations', label: 'Fuel Stations' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/add-credit', label: 'Add Credit' },
]

function Sidebar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

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
      </nav>
    </aside>
  )
}

export default Sidebar

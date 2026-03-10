import { Link, NavLink } from 'react-router-dom'
import styles from './Navbar.module.css'

const defaultLinks = [
  { to: '/home', label: 'Home' },
  { to: '/riders', label: 'Riders' },
  { to: '/stations', label: 'Stations' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/add-credit', label: 'Add Credit' },
]

function Navbar({ title = 'Boda Credit Tracker', links = defaultLinks }) {
  return (
    <header className={styles.navbar}>
      <Link to="/home" className={styles.brand}>
        {title}
      </Link>

      <nav className={styles.navLinks} aria-label="Main navigation">
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
    </header>
  )
}

export default Navbar

import { NavLink } from 'react-router-dom'
import logo from '../assets/Boda_Credit_logo.svg'
import styles from './Navbar.module.css'

const links = [
  { to: '/home', label: 'Home' },
  { to: '/riders', label: 'Riders' },
  { to: '/stations', label: 'Stations' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/add-credit', label: 'Add Credit' },
]

function Navbar() {
  return (
    <header className={styles.navbar}>
      <div className={styles.brand}>
        <img src={logo} alt="Boda Credit Tracker logo" className={styles.logo} />
      </div>
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

import { NavLink } from 'react-router-dom'
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
  return (
  <aside className={styles.sidebar}>
    <div className={styles.brand}>
      <img src={logo} alt="Boda Credit Tracker logo" className={styles.logo} />
    </div>

      <nav className={styles.navLinks} aria-label="Primary navigation">
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

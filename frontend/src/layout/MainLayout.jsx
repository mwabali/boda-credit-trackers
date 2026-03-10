import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import styles from './MainLayout.module.css'

function MainLayout() {
  return (
    <div className={styles.pageShell}>
      <Navbar />
      <section className={styles.contentArea}>
        <Outlet />
      </section>
    </div>
  )
}

export default MainLayout

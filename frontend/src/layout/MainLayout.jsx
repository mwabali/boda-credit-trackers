import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import styles from './MainLayout.module.css'

function MainLayout() {
  return (
    <div className={styles.appContainer}>
      <Sidebar />
      <main className={styles.contentArea}>
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout

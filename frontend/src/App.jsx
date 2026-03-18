import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './auth/ProtectedRoute'
import MainLayout from './layout/MainLayout'
import AddCreditPage from './pages/AddCreditPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RidersPage from './pages/RidersPage'
import StationsPage from './pages/StationsPage'
import TransactionsPage from './pages/TransactionsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/stations" element={<StationsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['company']} />}>
        <Route element={<MainLayout />}>
          <Route path="/riders" element={<RidersPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['company', 'station']} />}>
        <Route element={<MainLayout />}>
          <Route path="/add-credit" element={<AddCreditPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App

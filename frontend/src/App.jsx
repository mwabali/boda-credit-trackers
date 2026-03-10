import { Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from './layout/MainLayout'
import AddCreditPage from './pages/AddCreditPage'
import HomePage from './pages/HomePage'
import RidersPage from './pages/RidersPage'
import StationsPage from './pages/StationsPage'
import TransactionsPage from './pages/TransactionsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route element={<MainLayout />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/riders" element={<RidersPage />} />
        <Route path="/stations" element={<StationsPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/add-credit" element={<AddCreditPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}

export default App

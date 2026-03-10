import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import RidersPage from './pages/RidersPage'
import StationsPage from './pages/StationsPage'
import TransactionsPage from './pages/TransactionsPage'
import AddCreditPage from './pages/AddCreditPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/riders" element={<RidersPage />} />
      <Route path="/stations" element={<StationsPage />} />
      <Route path="/transactions" element={<TransactionsPage />} />
      <Route path="/add-credit" element={<AddCreditPage />} />
    </Routes>
  )
}

export default App

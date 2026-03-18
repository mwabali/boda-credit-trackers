import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

function ProtectedRoute({ allowedRoles = [], allowPending = false }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/home" replace />
  }

  if (
    !allowPending &&
    user?.role === 'station' &&
    user?.approvalStatus &&
    user.approvalStatus !== 'approved'
  ) {
    return (
      <Navigate
        to="/notifications"
        replace
        state={{ pendingApproval: true, from: location.pathname }}
      />
    )
  }

  return <Outlet />
}

export default ProtectedRoute

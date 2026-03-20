import { Navigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (user?.mustChangePassword) {
    return <Navigate to="/change-password" replace />
  }

  return children
}


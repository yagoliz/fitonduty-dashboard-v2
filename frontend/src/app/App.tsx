import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/shared/stores/authStore'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { AdminDashboard } from '@/features/admin/pages/AdminDashboard'
import { ParticipantDashboard } from '@/features/participant/pages/ParticipantDashboard'
import { SupervisorDashboard } from '@/features/supervisor/pages/SupervisorDashboard'
import { useEffect } from 'react'

function App() {
  const { isAuthenticated, user, fetchUser, token } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && token && !user) {
      fetchUser()
    }
  }, [isAuthenticated, token, user, fetchUser])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Admin routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Participant routes */}
      <Route
        path="/participant/*"
        element={
          <ProtectedRoute allowedRoles={['participant']}>
            <ParticipantDashboard />
          </ProtectedRoute>
        }
      />

      {/* Supervisor routes */}
      <Route
        path="/supervisor/*"
        element={
          <ProtectedRoute allowedRoles={['supervisor']}>
            <SupervisorDashboard />
          </ProtectedRoute>
        }
      />

      {/* Default redirect based on role */}
      <Route
        path="/"
        element={
          isAuthenticated && user ? (
            <Navigate
              to={
                user.role === 'admin'
                  ? '/admin'
                  : user.role === 'supervisor'
                    ? '/supervisor'
                    : '/participant'
              }
              replace
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

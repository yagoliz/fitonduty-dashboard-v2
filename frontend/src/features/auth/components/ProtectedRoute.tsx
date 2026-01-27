import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/shared/stores/authStore'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles: ('admin' | 'supervisor' | 'participant')[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!user) {
    // Still loading user info
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard
    const redirectPath =
      user.role === 'admin'
        ? '/admin'
        : user.role === 'supervisor'
          ? '/supervisor'
          : '/participant'
    return <Navigate to={redirectPath} replace />
  }

  return <>{children}</>
}

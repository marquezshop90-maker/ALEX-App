import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function AdminRoute() {
  const { user, profile } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (profile?.role !== 'super_admin') return <Navigate to="/dashboard" replace />
  return <Outlet />
}

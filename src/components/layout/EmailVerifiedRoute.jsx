// Email verification is not required in ALEX.
// Users access the app immediately after registration.
import { Outlet } from 'react-router-dom'
export default function EmailVerifiedRoute() {
  return <Outlet />
}

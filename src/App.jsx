import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import '../src/i18n/index.js'

// Layouts
import PublicLayout from './components/layout/PublicLayout'
import AppLayout from './components/layout/AppLayout'
import AdminLayout from './components/layout/AdminLayout'

// Guards
import PrivateRoute from './components/layout/PrivateRoute'
import AdminRoute from './components/layout/AdminRoute'
import EmailVerifiedRoute from './components/layout/EmailVerifiedRoute'

// Public Pages
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import VerifyEmail from './pages/auth/VerifyEmail'
import ForgotPassword from './pages/auth/ForgotPassword'

// App Pages
import Dashboard from './pages/Dashboard'
import ExamSelect from './pages/ExamSelect'
import ModuleList from './pages/modules/ModuleList'
import ModuleDetail from './pages/modules/ModuleDetail'
import Lesson from './pages/modules/Lesson'
import Flashcards from './pages/modules/Flashcards'
import MiniExam from './pages/exam/MiniExam'
import ExamResults from './pages/exam/ExamResults'
import SimulatedExam from './pages/exam/SimulatedExam'
import SimulatedResults from './pages/exam/SimulatedResults'
import Progress from './pages/Progress'
import Profile from './pages/Profile'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminContent from './pages/admin/AdminContent'
import AdminSubscriptions from './pages/admin/AdminSubscriptions'

// Loading
import SplashScreen from './components/ui/SplashScreen'

export default function App() {
  const { initialize, loading, initialized } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [])

  if (!initialized || loading) return <SplashScreen />

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1C2433',
            color: '#F9FAFB',
            border: '1px solid #263044',
            borderRadius: '12px',
          },
          success: { iconTheme: { primary: '#F59E0B', secondary: '#0A0F1E' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: '#F9FAFB' } },
        }}
      />

      <Routes>
        {/* PUBLIC */}
        <Route element={<PublicLayout />}>
          <Route path="/"               element={<Landing />} />
          <Route path="/login"          element={<Login />} />
          <Route path="/register"       element={<Register />} />
          <Route path="/verify-email"   element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* PRIVATE — requires login + email verified */}
        <Route element={<PrivateRoute />}>
          <Route element={<EmailVerifiedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard"       element={<Dashboard />} />
              <Route path="/select"          element={<ExamSelect />} />
              <Route path="/progress"        element={<Progress />} />
              <Route path="/profile"         element={<Profile />} />

              {/* Business & Law */}
              <Route path="/bl/modules"               element={<ModuleList examType="BL" />} />
              <Route path="/bl/modules/:moduleId"     element={<ModuleDetail examType="BL" />} />
              <Route path="/bl/lesson/:lessonId"      element={<Lesson />} />
              <Route path="/bl/flashcards/:moduleId"  element={<Flashcards />} />
              <Route path="/bl/mini-exam/:moduleId"   element={<MiniExam />} />
              <Route path="/bl/results/:sessionId"    element={<ExamResults />} />
              <Route path="/bl/simulation"            element={<SimulatedExam examType="BL" />} />
              <Route path="/bl/sim-results/:sessionId" element={<SimulatedResults />} />

              {/* Trade */}
              <Route path="/trade/modules"               element={<ModuleList examType="TRADE" />} />
              <Route path="/trade/modules/:moduleId"     element={<ModuleDetail examType="TRADE" />} />
              <Route path="/trade/lesson/:lessonId"      element={<Lesson />} />
              <Route path="/trade/flashcards/:moduleId"  element={<Flashcards />} />
              <Route path="/trade/mini-exam/:moduleId"   element={<MiniExam />} />
              <Route path="/trade/results/:sessionId"    element={<ExamResults />} />
              <Route path="/trade/simulation"            element={<SimulatedExam examType="TRADE" />} />
              <Route path="/trade/sim-results/:sessionId" element={<SimulatedResults />} />
            </Route>
          </Route>
        </Route>

        {/* ADMIN — requires super_admin role */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin"                element={<AdminDashboard />} />
            <Route path="/admin/users"          element={<AdminUsers />} />
            <Route path="/admin/subscriptions"  element={<AdminSubscriptions />} />
            <Route path="/admin/content"        element={<AdminContent />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

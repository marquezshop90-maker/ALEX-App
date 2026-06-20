import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import LanguageToggle from '../ui/LanguageToggle'

export default function PublicLayout() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-navy-700">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #1E40AF, #F59E0B)' }}>
              <span className="text-sm font-black text-white">A</span>
            </div>
            <span className="font-black text-white">ALEX</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            {user ? (
              <button onClick={() => navigate('/dashboard')} className="btn-primary py-2 px-4 text-sm">
                {t('nav.dashboard')}
              </button>
            ) : (
              <>
                <Link to="/login" className="btn-secondary py-2 px-4 text-sm">{t('auth.login')}</Link>
                <Link to="/register" className="btn-primary py-2 px-4 text-sm">{t('auth.registerBtn')}</Link>
              </>
            )}
          </div>
        </div>
      </nav>
      {/* Page content */}
      <div className="pt-16">
        <Outlet />
      </div>
    </div>
  )
}

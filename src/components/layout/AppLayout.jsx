import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import LanguageToggle from '../ui/LanguageToggle'
import {
  LayoutDashboard, BookOpen, TrendingUp, User,
  Shield, LogOut, Menu, X, ChevronRight
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, key: 'nav.dashboard' },
  { to: '/select',    icon: BookOpen,        key: 'nav.modules'   },
  { to: '/progress',  icon: TrendingUp,      key: 'nav.progress'  },
  { to: '/profile',   icon: User,            key: 'nav.profile'   },
]

export default function AppLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut, isSuperAdmin } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const NavLink = ({ to, icon: Icon, labelKey }) => {
    const active = location.pathname.startsWith(to)
    return (
      <Link
        to={to}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
          ${active
            ? 'bg-alex-amber/10 text-alex-amber border border-alex-amber/20'
            : 'text-gray-400 hover:text-gray-100 hover:bg-navy-700'
          }`}
      >
        <Icon size={20} className={active ? 'text-alex-amber' : ''} />
        <span className="font-medium text-sm">{t(labelKey)}</span>
        {active && <ChevronRight size={14} className="ml-auto text-alex-amber" />}
      </Link>
    )
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-navy-700">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
               style={{ background: 'linear-gradient(135deg, #1E40AF, #F59E0B)' }}>
            <span className="text-base font-black text-white">A</span>
          </div>
          <div>
            <p className="font-black text-white leading-none">ALEX</p>
            <p className="text-xs text-gray-500 leading-none mt-0.5">Achieve the EXam</p>
          </div>
        </Link>
      </div>

      {/* Plan badge */}
      <div className="px-4 py-3 border-b border-navy-700">
        <span className={profile?.subscription_type === 'premium' ? 'badge-premium' : 'badge-free'}>
          {profile?.subscription_type === 'premium' ? '⭐ Premium' : t('plans.free')}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => (
          <NavLink key={item.to} {...item} />
        ))}
        {isSuperAdmin() && (
          <NavLink to="/admin" icon={Shield} labelKey="nav.admin" />
        )}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-navy-700 space-y-2">
        <LanguageToggle />
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400
                     hover:text-alex-error hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut size={18} />
          <span className="font-medium text-sm">{t('nav.signout')}</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-navy-950">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-navy-900 border-r border-navy-700 fixed inset-y-0 left-0 z-40">
        <Sidebar />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-navy-900 border-r border-navy-700 z-10">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 glass border-b border-navy-700 h-14 flex items-center px-4 gap-3">
        <button onClick={() => setMobileOpen(true)} className="text-gray-400 hover:text-white">
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #1E40AF, #F59E0B)' }}>
            <span className="text-xs font-black text-white">A</span>
          </div>
          <span className="font-black text-white text-sm">ALEX</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-6 lg:py-8 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

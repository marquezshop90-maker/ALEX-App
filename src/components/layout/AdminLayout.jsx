import { Outlet, Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Shield, Users, CreditCard, FileText, BarChart3, ArrowLeft } from 'lucide-react'

const adminNav = [
  { to: '/admin',               icon: BarChart3,    key: 'admin.metrics'       },
  { to: '/admin/users',         icon: Users,        key: 'admin.users'         },
  { to: '/admin/subscriptions', icon: CreditCard,   key: 'admin.subscriptions' },
  { to: '/admin/content',       icon: FileText,     key: 'admin.content'       },
]

export default function AdminLayout() {
  const { t } = useTranslation()
  const location = useLocation()

  return (
    <div className="flex min-h-screen bg-navy-950">
      <aside className="w-64 bg-navy-900 border-r border-alex-blue/30 fixed inset-y-0 left-0 z-40 flex flex-col">
        <div className="p-6 border-b border-alex-blue/30">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={18} className="text-blue-400" />
            <span className="font-black text-white">Admin Panel</span>
          </div>
          <span className="badge-admin">ALEX · Super Admin</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {adminNav.map(({ to, icon: Icon, key }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to} to={to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${active
                    ? 'bg-alex-blue/20 text-blue-400 border border-alex-blue/30'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-navy-700'
                  }`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{t(key)}</span>
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-alex-blue/30">
          <Link to="/dashboard"
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
            <ArrowLeft size={16} />
            Back to App
          </Link>
        </div>
      </aside>
      <main className="flex-1 ml-64 min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-8 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Users, Crown, TrendingUp, BookOpen,
  Activity, Award, BarChart2, Clock
} from 'lucide-react'

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [topModules, setTopModules] = useState([])
  const [recentUsers, setRecentUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [])

  async function fetchMetrics() {
    try {
      // Total users
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })

      // Premium users
      const { count: premiumUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_type', 'premium')

      // Active last 7 days (users with progress updated recently)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const { count: activeUsers } = await supabase
        .from('user_module_progress')
        .select('user_id', { count: 'exact', head: true })
        .gte('updated_at', sevenDaysAgo.toISOString())

      // Exam sessions completed
      const { count: examsCompleted } = await supabase
        .from('exam_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')

      // Top modules by progress count
      const { data: moduleProgress } = await supabase
        .from('user_module_progress')
        .select('module_id, modules(code, title_en)')
        .not('completed_at', 'is', null)
        .limit(100)

      // Count completions per module
      const moduleCounts = {}
      moduleProgress?.forEach(p => {
        const key = p.modules?.code || p.module_id
        const title = p.modules?.title_en || key
        if (!moduleCounts[key]) moduleCounts[key] = { title, count: 0 }
        moduleCounts[key].count++
      })
      const sortedModules = Object.values(moduleCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Recent registrations
      const { data: recent } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, subscription_type, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      setMetrics({
        totalUsers: totalUsers || 0,
        premiumUsers: premiumUsers || 0,
        freeUsers: (totalUsers || 0) - (premiumUsers || 0),
        activeUsers: activeUsers || 0,
        examsCompleted: examsCompleted || 0,
        conversionRate: totalUsers > 0
          ? ((premiumUsers / totalUsers) * 100).toFixed(1)
          : '0.0'
      })
      setTopModules(sortedModules)
      setRecentUsers(recent || [])
    } catch (err) {
      console.error('Error fetching metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Loading metrics...</div>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Users',
      value: metrics.totalUsers,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10'
    },
    {
      label: 'Premium Users',
      value: metrics.premiumUsers,
      icon: Crown,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10'
    },
    {
      label: 'Active (7 days)',
      value: metrics.activeUsers,
      icon: Activity,
      color: 'text-green-400',
      bg: 'bg-green-400/10'
    },
    {
      label: 'Exams Completed',
      value: metrics.examsCompleted,
      icon: Award,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10'
    },
    {
      label: 'Free Users',
      value: metrics.freeUsers,
      icon: BookOpen,
      color: 'text-gray-400',
      bg: 'bg-gray-400/10'
    },
    {
      label: 'Conversion Rate',
      value: `${metrics.conversionRate}%`,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10'
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Metrics Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Overview of ALEX app performance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.bg}`}>
                  <Icon size={18} className={card.color} />
                </div>
                <span className="text-xs text-gray-400 font-medium">{card.label}</span>
              </div>
              <p className={`text-3xl font-black ${card.color}`}>{card.value}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Modules */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={18} className="text-alex-blue" />
            <h2 className="font-bold text-white">Top Completed Modules</h2>
          </div>
          {topModules.length === 0 ? (
            <p className="text-gray-500 text-sm">No completions yet</p>
          ) : (
            <div className="space-y-3">
              {topModules.map((mod, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300 truncate flex-1">{mod.title}</span>
                  <span className="text-xs text-alex-amber font-bold ml-2 bg-alex-amber/10 px-2 py-0.5 rounded-full">
                    {mod.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Registrations */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-alex-blue" />
            <h2 className="font-bold text-white">Recent Registrations</h2>
          </div>
          {recentUsers.length === 0 ? (
            <p className="text-gray-500 text-sm">No users yet</p>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {user.full_name || 'No name'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ml-2 font-medium ${
                    user.subscription_type === 'premium'
                      ? 'bg-amber-400/10 text-amber-400'
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {user.subscription_type === 'premium' ? 'Premium' : 'Free'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

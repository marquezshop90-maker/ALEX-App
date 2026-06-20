import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { BookOpen, TrendingUp, Award, Flame, ArrowRight, Star, Bell } from 'lucide-react'

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={22} />
    </div>
    <div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-gray-400 text-sm">{label}</p>
    </div>
  </div>
)

export default function Dashboard() {
  const { t, i18n } = useTranslation()
  const { user, profile, isPremium } = useAuthStore()
  const isEs = i18n.language === 'ES'
  const [stats, setStats]   = useState({ streak: 0, modules: 0, exams: 0 })
  const [alerts, setAlerts] = useState([])
  const [blProgress, setBlProgress]     = useState(0)
  const [tradeProgress, setTradeProgress] = useState(0)
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        // Streak
        const { data: streak } = await supabase
          .from('user_streaks').select('current_streak').eq('user_id', user.id).single()

        // Modules completed
        const { data: progress } = await supabase
          .from('user_module_progress')
          .select('status, module_id, modules(exam_type_id, exam_types(code))')
          .eq('user_id', user.id)

        const completed = progress?.filter(p => p.status === 'completed') || []
        const blDone    = completed.filter(p => p.modules?.exam_types?.code === 'BL').length
        const tradeDone = completed.filter(p => p.modules?.exam_types?.code === 'TRADE').length

        // Exams passed
        const { data: sessions } = await supabase
          .from('exam_sessions')
          .select('passed').eq('user_id', user.id).eq('passed', true)

        // B&L progress %
        const { count: blTotal }    = await supabase.from('modules').select('id', { count: 'exact' }).eq('is_active', true).eq('exam_type_id', (await supabase.from('exam_types').select('id').eq('code','BL').single()).data?.id)
        const { count: tradeTotal } = await supabase.from('modules').select('id', { count: 'exact' }).eq('is_active', true).eq('exam_type_id', (await supabase.from('exam_types').select('id').eq('code','TRADE').single()).data?.id)

        setStats({
          streak:  streak?.current_streak || 0,
          modules: completed.length,
          exams:   sessions?.length || 0,
        })
        setBlProgress(blTotal    ? Math.round((blDone / blTotal) * 100)    : 0)
        setTradeProgress(tradeTotal ? Math.round((tradeDone / tradeTotal) * 100) : 0)

        // Active alerts
        const { data: alertData } = await supabase
          .from('system_alerts')
          .select('*')
          .eq('is_active', true)
          .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(3)
        setAlerts(alertData || [])

        // Achievements
        const { data: achData } = await supabase
          .from('user_achievements')
          .select('earned_at, achievements(icon, name_en, name_es)')
          .eq('user_id', user.id)
          .order('earned_at', { ascending: false })
          .limit(4)
        setAchievements(achData || [])

      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const overallProgress = Math.round((blProgress + tradeProgress) / 2)

  const alertColors = { info: 'border-blue-500/40 bg-blue-500/10', warning: 'border-alex-warning/40 bg-alex-warning/10', urgent: 'border-alex-error/40 bg-alex-error/10' }
  const alertIcons  = { info: '📢', warning: '⚠️', urgent: '🚨' }

  return (
    <div className="space-y-8 animate-fade-in">

      {/* System Alerts */}
      {alerts.map(alert => (
        <div key={alert.id} className={`rounded-2xl border p-4 flex gap-3 ${alertColors[alert.type]}`}>
          <span className="text-xl flex-shrink-0">{alertIcons[alert.type]}</span>
          <div>
            <p className="font-bold text-white text-sm">{isEs ? alert.title_es : alert.title_en}</p>
            <p className="text-gray-300 text-sm mt-0.5">{isEs ? alert.message_es : alert.message_en}</p>
          </div>
        </div>
      ))}

      {/* Welcome */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-gray-400 text-sm">{t('dashboard.welcome')},</p>
          <h1 className="text-3xl font-black text-white mt-1">{firstName} 👋</h1>
          <p className="text-gray-400 mt-1">{t('dashboard.readyToStudy')}</p>
        </div>
        {!isPremium() && (
          <Link to="/profile"
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl
                       bg-alex-amber/10 border border-alex-amber/30 text-alex-amber
                       text-sm font-bold hover:bg-alex-amber/20 transition-all">
            <Star size={14} fill="currentColor" />
            {t('plans.upgrade')}
          </Link>
        )}
      </div>

      {/* Overall Progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-white">{t('dashboard.overallProgress')}</p>
          <span className="text-alex-amber font-black text-2xl">{overallProgress}%</span>
        </div>
        <div className="progress-bar mb-6">
          <div className="progress-fill" style={{ width: `${overallProgress}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-400">Business & Law</span>
              <span className="text-sm font-bold text-white">{blProgress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill bg-alex-blue" style={{ width: `${blProgress}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-400">Trade (Class B)</span>
              <span className="text-sm font-bold text-white">{tradeProgress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill bg-alex-success" style={{ width: `${tradeProgress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Flame}    label={t('dashboard.streak')}           value={`${stats.streak} 🔥`} color="bg-orange-500/20 text-orange-400" />
        <StatCard icon={BookOpen} label={t('dashboard.modulesCompleted')} value={stats.modules}        color="bg-alex-blue/20 text-blue-400" />
        <StatCard icon={Award}    label={t('dashboard.examsPassed')}      value={stats.exams}          color="bg-alex-amber/20 text-alex-amber" />
      </div>

      {/* Exam Cards */}
      <div>
        <h2 className="font-bold text-white mb-4 text-lg">{t('exams.selectExam')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/bl/modules" className="card-hover group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-alex-blue/20 flex items-center justify-center text-2xl">⚖️</div>
              <span className="badge-free text-xs">13 {t('exams.modules')}</span>
            </div>
            <h3 className="font-black text-white text-lg mb-1">{t('exams.bl')}</h3>
            <p className="text-gray-400 text-sm mb-4">{t('exams.blDesc')}</p>
            <div className="progress-bar mb-2">
              <div className="progress-fill bg-alex-blue" style={{ width: `${blProgress}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{blProgress}% complete</span>
              <ArrowRight size={16} className="text-gray-500 group-hover:text-alex-amber transition-colors" />
            </div>
          </Link>

          <Link to="/trade/modules" className="card-hover group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-alex-success/20 flex items-center justify-center text-2xl">🏗️</div>
              <span className="badge-free text-xs">18 {t('exams.modules')}</span>
            </div>
            <h3 className="font-black text-white text-lg mb-1">{t('exams.trade')}</h3>
            <p className="text-gray-400 text-sm mb-4">{t('exams.tradeDesc')}</p>
            <div className="progress-bar mb-2">
              <div className="progress-fill bg-alex-success" style={{ width: `${tradeProgress}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{tradeProgress}% complete</span>
              <ArrowRight size={16} className="text-gray-500 group-hover:text-alex-amber transition-colors" />
            </div>
          </Link>
        </div>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div>
          <h2 className="font-bold text-white mb-4 text-lg">{t('dashboard.achievements')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {achievements.map(({ achievements: ach, earned_at }) => (
              <div key={earned_at} className="card text-center py-4 border-alex-amber/20">
                <div className="text-3xl mb-2">{ach?.icon}</div>
                <p className="text-white font-bold text-xs">{isEs ? ach?.name_es : ach?.name_en}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Premium CTA for free users */}
      {!isPremium() && (
        <div className="card border-alex-amber/30 bg-gradient-to-r from-navy-800 to-navy-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-alex-amber/5 rounded-full blur-2xl" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Star size={16} className="text-alex-amber" fill="currentColor" />
                <span className="text-alex-amber font-bold text-sm">Premium</span>
              </div>
              <p className="font-black text-white text-lg">Ready to practice?</p>
              <p className="text-gray-400 text-sm mt-1">
                Unlock flashcards, mini-exams, AI tutoring & full simulation exams.
              </p>
            </div>
            <Link to="/profile" className="btn-primary flex-shrink-0 whitespace-nowrap">
              {t('premium.upgradeNow')}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

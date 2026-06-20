import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { TrendingUp, Award, Flame, Clock, CheckCircle2, BookOpen, Star } from 'lucide-react'

const TopicBar = ({ topic, failRate, failCount, total }) => (
  <div className="mb-3">
    <div className="flex items-center justify-between mb-1">
      <span className="text-sm text-gray-300 capitalize">{topic.replace(/_/g,' ')}</span>
      <span className={`text-xs font-bold ${failRate > 50 ? 'text-alex-error' : failRate > 30 ? 'text-alex-warning' : 'text-alex-success'}`}>
        {failCount}/{total} wrong
      </span>
    </div>
    <div className="progress-bar">
      <div className={`h-full rounded-full transition-all duration-700
        ${failRate > 50 ? 'bg-alex-error' : failRate > 30 ? 'bg-alex-warning' : 'bg-alex-success'}`}
        style={{ width: `${100 - failRate}%` }} />
    </div>
  </div>
)

export default function Progress() {
  const { t, i18n } = useTranslation()
  const { user }    = useAuthStore()
  const isEs        = i18n.language === 'ES'

  const [streak,    setStreak]    = useState(null)
  const [modules,   setModules]   = useState([])
  const [sessions,  setSessions]  = useState([])
  const [weakAreas, setWeakAreas] = useState([])
  const [achs,      setAchs]      = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const [streakRes, modRes, sessRes, weakRes, achRes] = await Promise.all([
          supabase.from('user_streaks').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('user_module_progress')
            .select('*, modules(title_en, title_es, code, exam_types(code))')
            .eq('user_id', user.id).order('last_accessed_at', { ascending: false }),
          supabase.from('exam_sessions')
            .select('*, exam_types(code, name_en, name_es)')
            .eq('user_id', user.id).not('completed_at', 'is', null)
            .order('completed_at', { ascending: false }).limit(10),
          supabase.from('user_weak_areas')
            .select('*').eq('user_id', user.id)
            .gt('fail_rate', 0).order('fail_rate', { ascending: false }).limit(8),
          supabase.from('user_achievements')
            .select('*, achievements(*)')
            .eq('user_id', user.id).order('earned_at', { ascending: false }),
        ])
        setStreak(streakRes.data)
        setModules(modRes.data || [])
        setSessions(sessRes.data || [])
        setWeakAreas(weakRes.data || [])
        setAchs(achRes.data || [])
      } catch (err) {
        console.error('Progress load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const blMods    = modules.filter(m => m.modules?.exam_types?.code === 'BL')
  const tradeMods = modules.filter(m => m.modules?.exam_types?.code === 'TRADE')
  const blDone    = blMods.filter(m => m.status === 'completed').length
  const tradeDone = tradeMods.filter(m => m.status === 'completed').length
  const simsPassed = sessions.filter(s => s.session_type === 'simulation' && s.passed).length
  const avgScore  = sessions.length
    ? Math.round(sessions.reduce((a, s) => a + (s.score_percentage || 0), 0) / sessions.length)
    : 0

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-alex-amber border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-3xl font-black text-white">
        {isEs ? 'Mi Progreso' : 'My Progress'}
      </h1>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Flame,      label: isEs ? 'Racha'            : 'Study Streak',   value: `${streak?.current_streak || 0}🔥`, color: 'text-orange-400 bg-orange-500/10' },
          { icon: BookOpen,   label: isEs ? 'Módulos'          : 'Modules Done',   value: `${blDone + tradeDone}`,              color: 'text-blue-400 bg-alex-blue/10' },
          { icon: TrendingUp, label: isEs ? 'Score Promedio'   : 'Avg Score',      value: `${avgScore}%`,                       color: 'text-alex-amber bg-alex-amber/10' },
          { icon: Award,      label: isEs ? 'Sims Aprobados'   : 'Sims Passed',    value: simsPassed,                           color: 'text-alex-success bg-alex-success/10' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xl font-black text-white">{value}</p>
              <p className="text-gray-500 text-xs">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Module progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { label: 'Business & Law', code: 'BL', done: blDone, total: 13, basePath: '/bl' },
          { label: 'Trade (Class B)', code: 'TRADE', done: tradeDone, total: 18, basePath: '/trade' },
        ].map(({ label, code, done, total, basePath }) => (
          <div key={code} className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-white">{label}</h2>
              <span className="text-alex-amber font-black">
                {total ? Math.round((done/total)*100) : 0}%
              </span>
            </div>
            <div className="progress-bar mb-2">
              <div className="progress-fill" style={{ width: `${total ? (done/total)*100 : 0}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-xs">{done} of {total} modules</p>
              <Link to={`${basePath}/modules`}
                className="text-alex-amber text-xs font-semibold hover:text-alex-amber-light transition-colors">
                {isEs ? 'Ver módulos →' : 'View modules →'}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Weak areas */}
      {weakAreas.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-alex-warning" />
            {isEs ? 'Áreas a Reforzar' : 'Topics to Strengthen'}
          </h2>
          {weakAreas.map(area => (
            <TopicBar
              key={area.id}
              topic={area.topic_tag}
              failRate={area.fail_rate || 0}
              failCount={area.fail_count}
              total={area.total_attempts}
            />
          ))}
        </div>
      )}

      {/* Recent exam sessions */}
      {sessions.length > 0 && (
        <div>
          <h2 className="font-bold text-white text-lg mb-4">
            {isEs ? 'Historial de Exámenes' : 'Exam History'}
          </h2>
          <div className="space-y-3">
            {sessions.map(s => (
              <div key={s.id} className="card flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                  ${s.passed ? 'bg-alex-success/20' : 'bg-alex-error/20'}`}>
                  {s.passed
                    ? <CheckCircle2 size={18} className="text-alex-success" />
                    : <Clock        size={18} className="text-alex-error" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm">
                    {s.session_type === 'simulation' ? '🏆 ' : '✏️ '}
                    {isEs ? s.exam_types?.name_es : s.exam_types?.name_en}
                    {' · '}
                    <span className="capitalize text-gray-400">
                      {s.session_type === 'simulation'
                        ? (isEs ? 'Simulado' : 'Simulation')
                        : (isEs ? 'Mini Examen' : 'Mini Exam')}
                    </span>
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {new Date(s.completed_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-black text-lg ${s.passed ? 'text-alex-success' : 'text-alex-error'}`}>
                    {Math.round(s.score_percentage || 0)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {s.correct_answers}/{s.total_questions}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {achs.length > 0 && (
        <div>
          <h2 className="font-bold text-white text-lg mb-4">
            {isEs ? 'Logros Obtenidos' : 'Achievements Earned'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {achs.map(({ achievements: ach, earned_at }) => (
              <div key={earned_at} className="card text-center border-alex-amber/20 py-5">
                <div className="text-3xl mb-2">{ach?.icon}</div>
                <p className="text-white font-bold text-sm">
                  {isEs ? ach?.name_es : ach?.name_en}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {isEs ? ach?.description_es : ach?.description_en}
                </p>
                <p className="text-gray-600 text-xs mt-2">
                  {new Date(earned_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {modules.length === 0 && sessions.length === 0 && (
        <div className="text-center py-16">
          <BookOpen size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-white font-bold text-lg mb-2">
            {isEs ? 'Aún no has empezado' : 'No activity yet'}
          </p>
          <p className="text-gray-400 text-sm mb-6">
            {isEs ? 'Comienza a estudiar para ver tu progreso aquí.'
                   : 'Start studying to see your progress here.'}
          </p>
          <Link to="/select" className="btn-primary inline-flex items-center gap-2">
            {isEs ? 'Empezar ahora' : 'Start Studying'} →
          </Link>
        </div>
      )}
    </div>
  )
}

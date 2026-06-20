import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { CheckCircle2, Clock, Circle, ChevronRight, Lock, ArrowLeft } from 'lucide-react'

const statusConfig = {
  completed:   { icon: CheckCircle2, color: 'text-alex-success', bg: 'bg-alex-success/20', label: 'modules.completed' },
  in_progress: { icon: Clock,        color: 'text-alex-amber',   bg: 'bg-alex-amber/20',   label: 'modules.inProgress' },
  not_started: { icon: Circle,       color: 'text-gray-500',     bg: 'bg-navy-700',         label: 'modules.notStarted' },
}

export default function ModuleList({ examType }) {
  const { t, i18n } = useTranslation()
  const { user, isPremium } = useAuthStore()
  const navigate = useNavigate()
  const isEs = i18n.language === 'ES'
  const [modules, setModules]   = useState([])
  const [progress, setProgress] = useState({})
  const [examInfo, setExamInfo] = useState(null)
  const [loading, setLoading]   = useState(true)

  const basePath = examType === 'BL' ? '/bl' : '/trade'

  useEffect(() => {
    const load = async () => {
      try {
        // Get exam type info
        const { data: exam } = await supabase
          .from('exam_types').select('*').eq('code', examType).single()
        setExamInfo(exam)

        // Get modules
        const { data: mods } = await supabase
          .from('modules')
          .select('*')
          .eq('exam_type_id', exam.id)
          .eq('is_active', true)
          .order('order_num')
        setModules(mods || [])

        // Get user progress for these modules
        if (user && mods?.length) {
          const { data: prog } = await supabase
            .from('user_module_progress')
            .select('*')
            .eq('user_id', user.id)
            .in('module_id', mods.map(m => m.id))
          const progMap = {}
          prog?.forEach(p => { progMap[p.module_id] = p })
          setProgress(progMap)
        }
      } catch (err) {
        console.error('ModuleList error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [examType, user])

  const completedCount = Object.values(progress).filter(p => p.status === 'completed').length

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-alex-amber border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 text-sm">{t('common.loading')}</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Back */}
      <button onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
        <ArrowLeft size={16} /> {t('common.back')}
      </button>

      {/* Header */}
      <div className="card">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
               style={{ background: examType === 'BL' ? '#1E40AF22' : '#10B98122' }}>
            {examType === 'BL' ? '⚖️' : '🏗️'}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-white">
              {isEs ? examInfo?.name_es : examInfo?.name_en}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {examInfo?.total_questions} questions · {Math.floor(examInfo?.time_minutes / 60)}h {examInfo?.time_minutes % 60}m · {examInfo?.passing_score}% to pass
            </p>
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">{completedCount} of {modules.length} modules completed</span>
                <span className="text-xs font-bold text-white">
                  {modules.length ? Math.round((completedCount / modules.length) * 100) : 0}%
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${modules.length ? (completedCount / modules.length) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Simulation button — premium only */}
        {completedCount === modules.length && modules.length > 0 && (
          isPremium() ? (
            <Link to={`${basePath}/simulation`}
              className="btn-primary w-full text-center mt-4 flex items-center justify-center gap-2">
              🏆 {t('exam.simulation')}
            </Link>
          ) : (
            <div className="mt-4 p-4 rounded-xl bg-alex-amber/10 border border-alex-amber/20 flex gap-3">
              <Lock size={16} className="text-alex-amber flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-300">
                Complete all modules and <Link to="/profile" className="text-alex-amber font-bold">upgrade to Premium</Link> to unlock the simulation exam.
              </p>
            </div>
          )
        )}
      </div>

      {/* Module List */}
      <div className="space-y-3">
        {modules.map((mod, idx) => {
          const prog     = progress[mod.id]
          const status   = prog?.status || 'not_started'
          const { icon: StatusIcon, color, bg } = statusConfig[status]
          const lessonPct = prog?.total_lessons
            ? Math.round((prog.lessons_completed / prog.total_lessons) * 100)
            : 0

          return (
            <Link
              key={mod.id}
              to={`${basePath}/modules/${mod.id}`}
              className="card-hover flex items-center gap-4 group"
            >
              {/* Status icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                <StatusIcon size={18} className={color} />
              </div>

              {/* Module icon + info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-lg">{mod.icon}</span>
                  <span className="text-xs text-gray-500 font-mono">{mod.code}</span>
                </div>
                <p className="font-bold text-white truncate">
                  {isEs ? mod.title_es : mod.title_en}
                </p>
                {status === 'in_progress' && (
                  <div className="progress-bar mt-2 h-1">
                    <div className="progress-fill h-full" style={{ width: `${lessonPct}%` }} />
                  </div>
                )}
              </div>

              {/* Duration + arrow */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {mod.estimated_hours && (
                  <span className="text-xs text-gray-500 hidden sm:block">
                    {mod.estimated_hours}h
                  </span>
                )}
                <ChevronRight size={16} className="text-gray-500 group-hover:text-alex-amber transition-colors" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

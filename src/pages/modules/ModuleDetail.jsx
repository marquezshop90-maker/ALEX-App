import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import PremiumGate from '../../components/ui/PremiumGate'
import {
  ArrowLeft, BookOpen, CheckCircle2, Circle, Clock,
  ExternalLink, Lock, Play, Star, Zap
} from 'lucide-react'

export default function ModuleDetail() {
  const { moduleId } = useParams()
  const { t, i18n } = useTranslation()
  const { user, isPremium } = useAuthStore()
  const navigate = useNavigate()
  const isEs = i18n.language === 'ES'

  const [module,     setModule]     = useState(null)
  const [lessons,    setLessons]    = useState([])
  const [references, setReferences] = useState([])
  const [progress,   setProgress]   = useState(null)
  const [lessonDone, setLessonDone] = useState({})
  const [loading,    setLoading]    = useState(true)

  const examType = module?.code?.startsWith('BL') ? 'BL' : 'TRADE'
  const basePath = examType === 'BL' ? '/bl' : '/trade'

  useEffect(() => {
    if (!moduleId) return
    const load = async () => {
      try {
        // Module info
        const { data: mod } = await supabase
          .from('modules').select('*, exam_types(code, name_en, name_es)')
          .eq('id', moduleId).single()
        setModule(mod)

        // Lessons
        const { data: less } = await supabase
          .from('lessons').select('*')
          .eq('module_id', moduleId).eq('is_active', true)
          .order('order_num')
        setLessons(less || [])

        // References
        const { data: refs } = await supabase
          .from('official_references').select('*')
          .eq('module_id', moduleId).eq('is_active', true)
        setReferences(refs || [])

        // User progress
        if (user) {
          const { data: prog } = await supabase
            .from('user_module_progress').select('*')
            .eq('user_id', user.id).eq('module_id', moduleId)
            .maybeSingle()
          setProgress(prog)

          // Which lessons are done (stored as JSON array in progress)
          if (prog?.completed_lesson_ids) {
            const done = {}
            prog.completed_lesson_ids.forEach(id => { done[id] = true })
            setLessonDone(done)
          }
        }
      } catch (err) {
        console.error('ModuleDetail error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [moduleId, user])

  const completedLessons = Object.keys(lessonDone).length
  const totalLessons     = lessons.length
  const pct = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0
  const allDone = totalLessons > 0 && completedLessons === totalLessons

  // Find the next incomplete lesson
  const nextLesson = lessons.find(l => !lessonDone[l.id])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-2 border-alex-amber border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!module) return (
    <div className="text-center py-20">
      <p className="text-gray-400">Module not found.</p>
      <button onClick={() => navigate(-1)} className="btn-secondary mt-4">Go Back</button>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Back */}
      <button onClick={() => navigate(`${basePath}/modules`)}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
        <ArrowLeft size={16} />
        {isEs ? examType === 'BL' ? 'Business & Law' : 'Trade (Clase B)'
               : examType === 'BL' ? 'Business & Law' : 'Trade (Class B)'}
      </button>

      {/* Module Header */}
      <div className="card">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-alex-amber/10 border border-alex-amber/20
                          flex items-center justify-center text-3xl flex-shrink-0">
            {module.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-gray-500 bg-navy-700 px-2 py-0.5 rounded">
                {module.code}
              </span>
              {progress?.status === 'completed' && (
                <span className="flex items-center gap-1 text-alex-success text-xs font-semibold">
                  <CheckCircle2 size={12} /> Completed
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">
              {isEs ? module.title_es : module.title_en}
            </h1>
            <p className="text-gray-400 text-sm mt-2 leading-relaxed">
              {isEs ? module.description_es : module.description_en}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 py-4 border-t border-b border-navy-700 mb-5">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <BookOpen size={15} className="text-alex-amber" />
            {totalLessons} {t('modules.lessons')}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock size={15} className="text-alex-amber" />
            ~{module.estimated_hours}h
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <CheckCircle2 size={15} className="text-alex-success" />
            {pct}% done
          </div>
        </div>

        {/* Progress bar */}
        {totalLessons > 0 && (
          <div className="mb-5">
            <div className="progress-bar">
              <div className="progress-fill transition-all duration-700"
                   style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        {/* Primary CTA */}
        {totalLessons > 0 && (
          <Link
            to={`${basePath}/lesson/${nextLesson?.id || lessons[0]?.id}`}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Play size={18} />
            {allDone
              ? (isEs ? 'Repasar módulo' : 'Review Module')
              : completedLessons === 0
                ? (isEs ? 'Comenzar módulo' : 'Start Module')
                : (isEs ? 'Continuar estudiando' : 'Continue Studying')
            }
          </Link>
        )}

        {totalLessons === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            Content coming soon for this module.
          </div>
        )}
      </div>

      {/* Lessons List */}
      {lessons.length > 0 && (
        <div>
          <h2 className="font-bold text-white text-lg mb-3">
            {t('modules.lessons')}
          </h2>
          <div className="space-y-2">
            {lessons.map((lesson, idx) => {
              const done = !!lessonDone[lesson.id]
              return (
                <Link
                  key={lesson.id}
                  to={`${basePath}/lesson/${lesson.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-navy-800 border border-navy-700
                             hover:border-alex-amber/30 hover:bg-navy-700 transition-all duration-200 group"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                                   text-sm font-bold transition-colors
                                   ${done
                                     ? 'bg-alex-success/20 text-alex-success'
                                     : 'bg-navy-700 text-gray-500 group-hover:bg-alex-amber/10 group-hover:text-alex-amber'
                                   }`}>
                    {done ? <CheckCircle2 size={16} /> : idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate transition-colors
                                   ${done ? 'text-gray-400' : 'text-white'}`}>
                      {isEs ? lesson.title_es : lesson.title_en}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      ~{lesson.estimated_minutes} min
                    </p>
                  </div>
                  {done && (
                    <span className="text-xs text-alex-success font-semibold flex-shrink-0">Done</span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Premium Features */}
      <div>
        <h2 className="font-bold text-white text-lg mb-3">Practice & Review</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Flashcards */}
          <PremiumGate>
            <Link to={`${basePath}/flashcards/${moduleId}`}
              className="card-hover flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20
                              flex items-center justify-center flex-shrink-0">
                <Zap size={20} className="text-blue-400" />
              </div>
              <div>
                <p className="font-bold text-white">Flashcards</p>
                <p className="text-gray-400 text-xs mt-0.5">
                  {isEs ? 'Repasa los conceptos clave' : 'Review key concepts'}
                </p>
              </div>
            </Link>
          </PremiumGate>

          {/* Mini Exam */}
          <PremiumGate>
            <Link
              to={allDone ? `${basePath}/mini-exam/${moduleId}` : '#'}
              onClick={e => !allDone && e.preventDefault()}
              className={`card-hover flex items-center gap-4 group
                          ${!allDone ? 'opacity-60 cursor-not-allowed' : ''}`}>
              <div className="w-12 h-12 rounded-xl bg-alex-amber/10 border border-alex-amber/20
                              flex items-center justify-center flex-shrink-0">
                <Star size={20} className="text-alex-amber" />
              </div>
              <div>
                <p className="font-bold text-white">
                  {t('modules.miniExam')}
                  {!allDone && (
                    <span className="ml-2 text-xs text-gray-500 font-normal">
                      (finish lessons first)
                    </span>
                  )}
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  {isEs ? '10-15 preguntas del módulo' : '10-15 module questions'}
                </p>
              </div>
            </Link>
          </PremiumGate>
        </div>
      </div>

      {/* Official References */}
      {references.length > 0 && (
        <div>
          <h2 className="font-bold text-white text-lg mb-3">
            {t('modules.references')}
          </h2>
          <div className="space-y-2">
            {references.map(ref => (
              <a key={ref.id} href={ref.url} target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-4 p-4 rounded-xl bg-navy-800 border border-navy-700
                           hover:border-blue-500/30 hover:bg-navy-700 transition-all duration-200 group">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center
                                flex-shrink-0 text-lg">
                  🏛️
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white text-sm">
                      {isEs ? ref.title_es : ref.title_en}
                    </p>
                    <ExternalLink size={12} className="text-gray-500 group-hover:text-blue-400
                                                        transition-colors flex-shrink-0" />
                  </div>
                  <p className="text-xs text-blue-400 mt-0.5">{ref.agency}</p>
                  {(isEs ? ref.description_es : ref.description_en) && (
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {isEs ? ref.description_es : ref.description_en}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-3 flex items-center gap-1">
            <ExternalLink size={10} />
            Links open official government websites. Content may change — always verify with the source.
          </p>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import {
  ArrowLeft, ArrowRight, CheckCircle2, Clock,
  BookOpen, ChevronRight, Menu, X
} from 'lucide-react'
import toast from 'react-hot-toast'

// Render lesson content with basic markdown-like formatting
function LessonContent({ content }) {
  const renderLine = (line, idx) => {
    if (!line.trim()) return <div key={idx} className="h-3" />

    // H2 heading: ## text
    if (line.startsWith('## ')) {
      return (
        <h2 key={idx} className="text-xl font-black text-white mt-8 mb-3 flex items-center gap-2">
          <span className="w-1 h-6 bg-alex-amber rounded-full flex-shrink-0" />
          {line.replace('## ', '')}
        </h2>
      )
    }
    // H3 heading: ### text
    if (line.startsWith('### ')) {
      return (
        <h3 key={idx} className="text-base font-bold text-alex-amber mt-5 mb-2">
          {line.replace('### ', '')}
        </h3>
      )
    }
    // Bullet point: - text
    if (line.startsWith('- ')) {
      return (
        <div key={idx} className="flex items-start gap-3 my-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-alex-amber flex-shrink-0 mt-2" />
          <p className="text-gray-300 text-sm leading-relaxed">{line.replace('- ', '')}</p>
        </div>
      )
    }
    // Numbered: 1. text
    const numMatch = line.match(/^(\d+)\.\s(.+)/)
    if (numMatch) {
      return (
        <div key={idx} className="flex items-start gap-3 my-1.5">
          <span className="w-6 h-6 rounded-full bg-alex-blue/20 text-blue-400 text-xs font-bold
                           flex items-center justify-center flex-shrink-0 mt-0.5">
            {numMatch[1]}
          </span>
          <p className="text-gray-300 text-sm leading-relaxed">{numMatch[2]}</p>
        </div>
      )
    }
    // Highlight box: > text
    if (line.startsWith('> ')) {
      return (
        <div key={idx} className="my-4 pl-4 border-l-2 border-alex-amber bg-alex-amber/5
                                   rounded-r-xl py-3 pr-4">
          <p className="text-alex-amber text-sm font-semibold leading-relaxed">
            {line.replace('> ', '')}
          </p>
        </div>
      )
    }
    // Warning box: ! text
    if (line.startsWith('! ')) {
      return (
        <div key={idx} className="my-4 pl-4 border-l-2 border-alex-error bg-alex-error/5
                                   rounded-r-xl py-3 pr-4">
          <p className="text-red-400 text-sm font-semibold leading-relaxed">
            ⚠️ {line.replace('! ', '')}
          </p>
        </div>
      )
    }
    // Key term: **text** (bold inline)
    const boldLine = line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
    return (
      <p key={idx} className="text-gray-300 text-sm leading-relaxed my-2"
         dangerouslySetInnerHTML={{ __html: boldLine }} />
    )
  }

  return (
    <div className="prose-alex">
      {content.split('\n').map((line, idx) => renderLine(line, idx))}
    </div>
  )
}

export default function Lesson() {
  const { lessonId } = useParams()
  const [searchParams] = useSearchParams()
  const { i18n } = useTranslation()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isEs = i18n.language === 'ES'

  const [lesson,    setLesson]    = useState(null)
  const [module,    setModule]    = useState(null)
  const [allLessons, setAllLessons] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [marking,   setMarking]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const examType = module?.code?.startsWith('BL') ? 'BL' : 'TRADE'
  const basePath = examType === 'BL' ? '/bl' : '/trade'

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        // Load current lesson
        const { data: les } = await supabase
          .from('lessons').select('*, modules(*, exam_types(code))')
          .eq('id', lessonId).single()
        setLesson(les)
        setModule(les?.modules)

        // Load all lessons in this module for navigation
        if (les?.module_id) {
          const { data: all } = await supabase
            .from('lessons').select('id, order_num, title_en, title_es')
            .eq('module_id', les.module_id).eq('is_active', true)
            .order('order_num')
          setAllLessons(all || [])
        }

        // Check if this lesson is already done
        if (user && les?.module_id) {
          const { data: prog } = await supabase
            .from('user_module_progress').select('completed_lesson_ids')
            .eq('user_id', user.id).eq('module_id', les.module_id)
            .maybeSingle()
          if (prog?.completed_lesson_ids?.includes(lessonId)) {
            setDone(true)
          }
        }

        // Update streak
        if (user) {
          await supabase.rpc('update_user_streak', { p_user_id: user.id })
        }
      } catch (err) {
        console.error('Lesson load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [lessonId, user])

  const currentIdx = allLessons.findIndex(l => l.id === lessonId)
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null

  const markComplete = useCallback(async () => {
    if (!user || !lesson || done) return
    setMarking(true)
    try {
      // Get or create progress record
      const { data: existing } = await supabase
        .from('user_module_progress').select('*')
        .eq('user_id', user.id).eq('module_id', lesson.module_id)
        .maybeSingle()

      const completedIds = existing?.completed_lesson_ids || []
      if (!completedIds.includes(lessonId)) completedIds.push(lessonId)

      const isModuleComplete = completedIds.length === allLessons.length
      const now = new Date().toISOString()

      if (existing) {
        await supabase.from('user_module_progress').update({
          lessons_completed:    completedIds.length,
          total_lessons:        allLessons.length,
          completed_lesson_ids: completedIds,
          status:               isModuleComplete ? 'completed' : 'in_progress',
          last_accessed_at:     now,
          completed_at:         isModuleComplete ? now : null,
        }).eq('id', existing.id)
      } else {
        await supabase.from('user_module_progress').insert({
          user_id:              user.id,
          module_id:            lesson.module_id,
          lessons_completed:    1,
          total_lessons:        allLessons.length,
          completed_lesson_ids: [lessonId],
          status:               allLessons.length === 1 ? 'completed' : 'in_progress',
          last_accessed_at:     now,
        })
      }

      setDone(true)
      if (isModuleComplete) {
        toast.success('Module complete! 🎉')
      }
    } catch (err) {
      console.error('Mark complete error:', err)
      toast.error('Could not save progress.')
    } finally {
      setMarking(false)
    }
  }, [user, lesson, lessonId, done, allLessons])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-alex-amber border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!lesson) return (
    <div className="text-center py-20">
      <p className="text-gray-400">Lesson not found.</p>
      <button onClick={() => navigate(-1)} className="btn-secondary mt-4">Go Back</button>
    </div>
  )

  const content = isEs ? lesson.content_es : lesson.content_en
  const title   = isEs ? lesson.title_es   : lesson.title_en

  return (
    <div className="flex gap-0 lg:gap-8 relative">

      {/* Sidebar — lesson list */}
      <>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-navy-900 border-r border-navy-700
                            p-4 overflow-y-auto z-10">
              <div className="flex items-center justify-between mb-4">
                <p className="font-bold text-white text-sm">{isEs ? module?.title_es : module?.title_en}</p>
                <button onClick={() => setSidebarOpen(false)}><X size={18} className="text-gray-400" /></button>
              </div>
              <div className="space-y-1">
                {allLessons.map((l, idx) => (
                  <button key={l.id} onClick={() => { navigate(`${basePath}/lesson/${l.id}`); setSidebarOpen(false) }}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                                ${l.id === lessonId ? 'bg-alex-amber/10 text-alex-amber' : 'text-gray-400 hover:text-white hover:bg-navy-700'}`}>
                    <span className="font-mono text-xs w-5 text-center">{idx + 1}</span>
                    <span className="truncate">{isEs ? l.title_es : l.title_en}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-8 bg-navy-800 border border-navy-700 rounded-2xl p-4">
            <p className="font-bold text-white text-sm mb-3 truncate">
              {isEs ? module?.title_es : module?.title_en}
            </p>
            <div className="space-y-1">
              {allLessons.map((l, idx) => (
                <button key={l.id}
                  onClick={() => navigate(`${basePath}/lesson/${l.id}`)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors
                              ${l.id === lessonId
                                ? 'bg-alex-amber/10 text-alex-amber font-semibold'
                                : 'text-gray-400 hover:text-white hover:bg-navy-700'}`}>
                  <span className="font-mono w-4 text-center flex-shrink-0">{idx + 1}</span>
                  <span className="truncate">{isEs ? l.title_es : l.title_en}</span>
                  {l.id === lessonId && <ChevronRight size={12} className="ml-auto flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </>

      {/* Main content */}
      <div className="flex-1 min-w-0">

        {/* Top bar */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg bg-navy-800 border border-navy-700 text-gray-400">
            <Menu size={18} />
          </button>
          <button onClick={() => navigate(`${basePath}/modules/${lesson.module_id}`)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
            <ArrowLeft size={15} />
            {isEs ? 'Módulo' : 'Module'}
          </button>
          <span className="text-gray-600">/</span>
          <span className="text-gray-500 text-sm truncate">
            {currentIdx + 1} of {allLessons.length}
          </span>
        </div>

        {/* Lesson header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <BookOpen size={12} />
            <span>~{lesson.estimated_minutes} min read</span>
            {done && (
              <span className="flex items-center gap-1 text-alex-success ml-2">
                <CheckCircle2 size={12} /> Done
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">{title}</h1>
        </div>

        {/* Progress bar */}
        <div className="progress-bar mb-8">
          <div className="progress-fill transition-all duration-500"
               style={{ width: `${allLessons.length ? ((currentIdx + 1) / allLessons.length) * 100 : 0}%` }} />
        </div>

        {/* Content */}
        <div className="card mb-6">
          <LessonContent content={content} />
        </div>

        {/* Bottom navigation */}
        <div className="flex items-center justify-between gap-4">
          {prevLesson ? (
            <button onClick={() => navigate(`${basePath}/lesson/${prevLesson.id}`)}
              className="btn-secondary flex items-center gap-2 text-sm">
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">
                {isEs ? prevLesson.title_es : prevLesson.title_en}
              </span>
              <span className="sm:hidden">Previous</span>
            </button>
          ) : (
            <button onClick={() => navigate(`${basePath}/modules/${lesson.module_id}`)}
              className="btn-secondary flex items-center gap-2 text-sm">
              <ArrowLeft size={16} /> Back to Module
            </button>
          )}

          {/* Mark complete + Next */}
          <div className="flex items-center gap-3">
            {!done && (
              <button onClick={markComplete} disabled={marking}
                className="btn-primary flex items-center gap-2 text-sm">
                {marking
                  ? <div className="w-4 h-4 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
                  : <CheckCircle2 size={16} />
                }
                {isEs ? 'Marcar como hecho' : 'Mark Complete'}
              </button>
            )}
            {nextLesson ? (
              <button
                onClick={async () => {
                  if (!done) await markComplete()
                  navigate(`${basePath}/lesson/${nextLesson.id}`)
                }}
                className="btn-primary flex items-center gap-2 text-sm">
                {isEs ? 'Siguiente' : 'Next'}
                <ArrowRight size={16} />
              </button>
            ) : done && (
              <button
                onClick={() => navigate(`${basePath}/modules/${lesson.module_id}`)}
                className="btn-primary flex items-center gap-2 text-sm">
                {isEs ? 'Ver módulo' : 'Back to Module'}
                <CheckCircle2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

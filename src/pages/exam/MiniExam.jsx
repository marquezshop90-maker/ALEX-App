import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { CheckCircle2, XCircle, ArrowRight, Clock, AlertCircle } from 'lucide-react'

export default function MiniExam() {
  const { moduleId } = useParams()
  const { i18n }     = useTranslation()
  const { user }     = useAuthStore()
  const navigate     = useNavigate()
  const isEs         = i18n.language === 'ES'

  const [questions, setQuestions] = useState([])
  const [module,    setModule]    = useState(null)
  const [examType,  setExamType]  = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [phase,     setPhase]     = useState('intro') // intro | exam | feedback | done
  const [idx,       setIdx]       = useState(0)
  const [selected,  setSelected]  = useState(null)
  const [answers,   setAnswers]   = useState([])    // {questionId, selectedId, correct, explanation}
  const [sessionId, setSessionId] = useState(null)
  const startTime = useRef(null)
  const qStartTime = useRef(null)

  const basePath = module?.code?.startsWith('BL') ? '/bl' : '/trade'

  useEffect(() => {
    const load = async () => {
      try {
        const { data: mod } = await supabase
          .from('modules').select('*, exam_types(id, code, name_en, name_es)')
          .eq('id', moduleId).single()
        setModule(mod)
        setExamType(mod?.exam_types)

        // Load questions with options
        const { data: qs } = await supabase
          .from('questions')
          .select('*, question_options(*)')
          .eq('module_id', moduleId)
          .eq('is_active', true)
          .order('difficulty')
          .limit(15)
        setQuestions(qs || [])
      } catch (err) {
        console.error('MiniExam load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [moduleId])

  const startExam = async () => {
    // Create exam session
    if (user && examType) {
      const { data: session } = await supabase
        .from('exam_sessions').insert({
          user_id:         user.id,
          exam_type_id:    examType.id,
          session_type:    'mini_exam',
          module_id:       moduleId,
          total_questions: questions.length,
        }).select().single()
      setSessionId(session?.id)
    }
    startTime.current  = Date.now()
    qStartTime.current = Date.now()
    setPhase('exam')
  }

  const handleSelect = (optionId) => {
    if (selected !== null) return // already answered
    setSelected(optionId)
    setPhase('feedback')
  }

  const currentQ = questions[idx]
  const correctOption = currentQ?.question_options?.find(o => o.is_correct)
  const isCorrect = selected === correctOption?.id

  const handleNext = async () => {
    const timeSpent = Math.round((Date.now() - qStartTime.current) / 1000)

    // Save answer
    const answerData = {
      questionId:    currentQ.id,
      selectedId:    selected,
      correctId:     correctOption?.id,
      correct:       isCorrect,
      explanationEn: currentQ.explanation_en,
      explanationEs: currentQ.explanation_es,
      questionEn:    currentQ.question_en,
      questionEs:    currentQ.question_es,
      options:       currentQ.question_options,
    }
    const newAnswers = [...answers, answerData]
    setAnswers(newAnswers)

    // Save to DB
    if (sessionId) {
      await supabase.from('exam_session_answers').insert({
        session_id:          sessionId,
        question_id:         currentQ.id,
        selected_option_id:  selected,
        is_correct:          isCorrect,
        time_spent_seconds:  timeSpent,
      })
    }

    if (idx + 1 < questions.length) {
      setIdx(i => i + 1)
      setSelected(null)
      setPhase('exam')
      qStartTime.current = Date.now()
    } else {
      // Exam complete
      const correct = newAnswers.filter(a => a.correct).length
      const pct     = Math.round((correct / newAnswers.length) * 100)
      const passed  = pct >= 80
      const totalTime = Math.round((Date.now() - startTime.current) / 1000)

      if (sessionId) {
        await supabase.from('exam_sessions').update({
          completed_at:      new Date().toISOString(),
          correct_answers:   correct,
          score_percentage:  pct,
          passed,
          time_spent_seconds: totalTime,
        }).eq('id', sessionId)
      }

      // Update module progress
      if (user) {
        const { data: prog } = await supabase
          .from('user_module_progress').select('*')
          .eq('user_id', user.id).eq('module_id', moduleId).maybeSingle()

        if (prog) {
          await supabase.from('user_module_progress').update({
            mini_exam_score:  pct,
            mini_exam_passed: passed,
            attempts:         (prog.attempts || 0) + 1,
          }).eq('id', prog.id)
        }

        // Update weak areas for wrong answers
        for (const ans of newAnswers.filter(a => !a.correct)) {
          const q = questions.find(q => q.id === ans.questionId)
          if (!q?.topic_tag) continue
          await supabase.rpc('upsert_weak_area', {
            p_user_id:     user.id,
            p_exam_type_id: examType.id,
            p_topic_tag:   q.topic_tag,
            p_correct:     false,
          })
        }
      }

      navigate(`${basePath}/results/${sessionId || 'local'}`, {
        state: { answers: newAnswers, score: pct, passed, total: newAnswers.length, correct }
      })
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-alex-amber border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (questions.length === 0) return (
    <div className="text-center py-20 max-w-md mx-auto">
      <AlertCircle size={40} className="text-alex-warning mx-auto mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">No questions yet</h2>
      <p className="text-gray-400 text-sm mb-6">
        Questions for this module are being added. Check back soon!
      </p>
      <button onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
    </div>
  )

  // INTRO
  if (phase === 'intro') return (
    <div className="max-w-lg mx-auto text-center animate-slide-up py-12">
      <div className="text-5xl mb-6">✏️</div>
      <h1 className="text-3xl font-black text-white mb-3">
        {isEs ? 'Mini Examen' : 'Mini Exam'}
      </h1>
      <p className="text-gray-400 mb-2 font-semibold">
        {isEs ? module?.title_es : module?.title_en}
      </p>
      <p className="text-gray-500 text-sm mb-8">
        {questions.length} questions · Pass with 80% · No time limit
      </p>
      <div className="card text-left mb-8 space-y-3">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={16} className="text-alex-success mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-300">Read each question carefully before selecting your answer</p>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle2 size={16} className="text-alex-success mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-300">After each answer you'll see an explanation</p>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle2 size={16} className="text-alex-success mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-300">Score 80% or higher to complete this module</p>
        </div>
      </div>
      <button onClick={startExam} className="btn-primary w-full flex items-center justify-center gap-2 py-4">
        {isEs ? 'Comenzar Examen' : 'Start Exam'} <ArrowRight size={18} />
      </button>
    </div>
  )

  // EXAM + FEEDBACK
  const options = currentQ?.question_options?.sort((a, b) => a.order_num - b.order_num) || []

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">
            {isEs ? 'Pregunta' : 'Question'} {idx + 1} / {questions.length}
          </span>
        </div>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300
              ${i < idx
                ? (answers[i]?.correct ? 'bg-alex-success w-6' : 'bg-alex-error w-6')
                : i === idx ? 'bg-alex-amber w-6' : 'bg-navy-700 w-4'
              }`} />
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="progress-bar mb-6">
        <div className="progress-fill transition-all duration-500"
             style={{ width: `${(idx / questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="card mb-5">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">
          {currentQ?.topic_tag?.replace(/_/g, ' ')}
        </p>
        <p className="text-white font-semibold text-lg leading-relaxed">
          {isEs ? currentQ?.question_es : currentQ?.question_en}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {options.map((opt, i) => {
          const letter    = ['A', 'B', 'C', 'D'][i]
          const isSelected = selected === opt.id
          const isRight    = opt.is_correct

          let style = 'border-navy-700 bg-navy-800 hover:border-alex-amber/40 cursor-pointer'
          if (phase === 'feedback') {
            if (isRight)                style = 'border-alex-success bg-alex-success/10 cursor-default'
            else if (isSelected && !isRight) style = 'border-alex-error bg-alex-error/10 cursor-default'
            else                         style = 'border-navy-700 bg-navy-800 opacity-50 cursor-default'
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              disabled={phase === 'feedback'}
              className={`w-full text-left flex items-start gap-4 p-4 rounded-xl border
                          transition-all duration-200 ${style}`}
            >
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black
                               flex-shrink-0 transition-colors
                               ${phase === 'feedback' && isRight   ? 'bg-alex-success text-white'
                               : phase === 'feedback' && isSelected ? 'bg-alex-error text-white'
                               : 'bg-navy-700 text-gray-300'}`}>
                {phase === 'feedback' && isRight    ? <CheckCircle2 size={16} />
                : phase === 'feedback' && isSelected ? <XCircle size={16} />
                : letter}
              </span>
              <span className="text-sm text-gray-200 leading-relaxed pt-1">
                {isEs ? opt.option_text_es : opt.option_text_en}
              </span>
            </button>
          )
        })}
      </div>

      {/* Feedback */}
      {phase === 'feedback' && (
        <div className={`card mb-6 border-l-4 animate-slide-up
          ${isCorrect ? 'border-alex-success bg-alex-success/5' : 'border-alex-error bg-alex-error/5'}`}>
          <div className="flex items-center gap-2 mb-2">
            {isCorrect
              ? <CheckCircle2 size={18} className="text-alex-success" />
              : <XCircle size={18} className="text-alex-error" />
            }
            <span className={`font-black text-sm ${isCorrect ? 'text-alex-success' : 'text-alex-error'}`}>
              {isCorrect
                ? (isEs ? '¡Correcto!' : 'Correct!')
                : (isEs ? 'Incorrecto' : 'Incorrect')}
            </span>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">
            {isEs ? currentQ?.explanation_es : currentQ?.explanation_en}
          </p>
        </div>
      )}

      {/* Next button */}
      {phase === 'feedback' && (
        <button onClick={handleNext}
          className="btn-primary w-full flex items-center justify-center gap-2 animate-slide-up">
          {idx + 1 < questions.length
            ? (isEs ? 'Siguiente Pregunta' : 'Next Question')
            : (isEs ? 'Ver Resultados'     : 'See Results')
          }
          <ArrowRight size={18} />
        </button>
      )}
    </div>
  )
}

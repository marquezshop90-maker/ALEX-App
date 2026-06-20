import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { Clock, AlertTriangle, CheckCircle2, XCircle, ArrowRight, Flag } from 'lucide-react'

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

export default function SimulatedExam({ examType: examTypeProp }) {
  const { i18n }   = useTranslation()
  const { user }   = useAuthStore()
  const navigate   = useNavigate()
  const isEs       = i18n.language === 'ES'

  const [examInfo,   setExamInfo]   = useState(null)
  const [questions,  setQuestions]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [phase,      setPhase]      = useState('intro')   // intro | exam | confirm | done
  const [idx,        setIdx]        = useState(0)
  const [answers,    setAnswers]    = useState({})         // {questionId: optionId}
  const [flagged,    setFlagged]    = useState(new Set())
  const [timeLeft,   setTimeLeft]   = useState(0)
  const [sessionId,  setSessionId]  = useState(null)
  const [showNav,    setShowNav]    = useState(false)
  const timerRef    = useRef(null)
  const startTime   = useRef(null)

  const basePath = examTypeProp === 'BL' ? '/bl' : '/trade'

  useEffect(() => {
    const load = async () => {
      try {
        const { data: exam } = await supabase
          .from('exam_types').select('*').eq('code', examTypeProp).single()
        setExamInfo(exam)
        setTimeLeft(exam.time_minutes * 60)

        // Pull all simulation-eligible questions, shuffle, limit to exam total
        const { data: qs } = await supabase
          .from('questions')
          .select('*, question_options(*)')
          .eq('exam_type_id', exam.id)
          .eq('is_simulation_eligible', true)
          .eq('is_active', true)
        
        const shuffled = (qs || []).sort(() => Math.random() - 0.5)
          .slice(0, exam.total_questions)
        setQuestions(shuffled)
      } catch (err) {
        console.error('Sim exam load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [examTypeProp])

  // Timer
  useEffect(() => {
    if (phase !== 'exam') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          submitExam()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase])

  const startExam = async () => {
    if (user && examInfo) {
      const { data: s } = await supabase
        .from('exam_sessions').insert({
          user_id:         user.id,
          exam_type_id:    examInfo.id,
          session_type:    'simulation',
          total_questions: questions.length,
        }).select().single()
      setSessionId(s?.id)
    }
    startTime.current = Date.now()
    setPhase('exam')
  }

  const selectAnswer = (questionId, optionId) => {
    setAnswers(a => ({ ...a, [questionId]: optionId }))
  }

  const toggleFlag = (questionId) => {
    setFlagged(f => {
      const next = new Set(f)
      next.has(questionId) ? next.delete(questionId) : next.add(questionId)
      return next
    })
  }

  const submitExam = useCallback(async () => {
    clearInterval(timerRef.current)
    const totalTime  = Math.round((Date.now() - startTime.current) / 1000)
    const answerRows = []
    let correct = 0

    for (const q of questions) {
      const selectedId  = answers[q.id]
      const correctOpt  = q.question_options?.find(o => o.is_correct)
      const isCorrect   = selectedId === correctOpt?.id
      if (isCorrect) correct++
      answerRows.push({
        questionId:    q.id,
        selectedId,
        correctId:     correctOpt?.id,
        correct:       isCorrect,
        questionEn:    q.question_en,
        questionEs:    q.question_es,
        explanationEn: q.explanation_en,
        explanationEs: q.explanation_es,
        options:       q.question_options,
        topicTag:      q.topic_tag,
      })
    }

    const score  = Math.round((correct / questions.length) * 100)
    const passed = score >= examInfo.passing_score

    if (sessionId) {
      await supabase.from('exam_sessions').update({
        completed_at:      new Date().toISOString(),
        correct_answers:   correct,
        score_percentage:  score,
        passed,
        time_spent_seconds: totalTime,
      }).eq('id', sessionId)

      // Save all answers
      const dbAnswers = answerRows.map(a => ({
        session_id:         sessionId,
        question_id:        a.questionId,
        selected_option_id: a.selectedId,
        is_correct:         a.correct,
      }))
      await supabase.from('exam_session_answers').insert(dbAnswers)

      // Update weak areas for wrong answers
      if (user) {
        for (const a of answerRows.filter(a => !a.correct && a.topicTag)) {
          await supabase.rpc('upsert_weak_area', {
            p_user_id:      user.id,
            p_exam_type_id: examInfo.id,
            p_topic_tag:    a.topicTag,
            p_correct:      false,
          })
        }
      }
    }

    navigate(`${basePath}/sim-results/${sessionId || 'local'}`, {
      state: {
        answers: answerRows,
        score,
        passed,
        total:   questions.length,
        correct,
        timeUsed: totalTime,
        examName: isEs ? examInfo.name_es : examInfo.name_en,
      }
    })
  }, [answers, questions, examInfo, sessionId, basePath, isEs, user])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-alex-amber border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (questions.length === 0) return (
    <div className="text-center py-20 max-w-md mx-auto">
      <AlertTriangle size={40} className="text-alex-warning mx-auto mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">Not enough questions yet</h2>
      <p className="text-gray-400 text-sm mb-6">
        The question bank for this exam is still being built. Check back soon.
      </p>
      <button onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
    </div>
  )

  // INTRO
  if (phase === 'intro') return (
    <div className="max-w-lg mx-auto text-center animate-slide-up py-12">
      <div className="text-5xl mb-6">🏆</div>
      <h1 className="text-3xl font-black text-white mb-2">
        {isEs ? 'Examen Simulado' : 'Simulation Exam'}
      </h1>
      <p className="text-alex-amber font-bold mb-6">
        {isEs ? examInfo?.name_es : examInfo?.name_en}
      </p>

      <div className="card text-left mb-8 space-y-4">
        <div className="grid grid-cols-3 gap-4 pb-4 border-b border-navy-700">
          <div className="text-center">
            <p className="text-2xl font-black text-white">{questions.length}</p>
            <p className="text-xs text-gray-400 mt-1">Questions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-white">
              {Math.floor((examInfo?.time_minutes || 0) / 60)}h{(examInfo?.time_minutes || 0) % 60}m
            </p>
            <p className="text-xs text-gray-400 mt-1">Time limit</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-alex-amber">{examInfo?.passing_score}%</p>
            <p className="text-xs text-gray-400 mt-1">To pass</p>
          </div>
        </div>

        {[
          'Once started, the timer cannot be paused',
          'You can flag questions to review before submitting',
          'You can navigate between questions freely',
          'Submit before time runs out — it auto-submits at zero',
        ].map((tip, i) => (
          <div key={i} className="flex items-start gap-3">
            <CheckCircle2 size={15} className="text-alex-success mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-300">{tip}</p>
          </div>
        ))}
      </div>

      <button onClick={startExam}
        className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg">
        {isEs ? 'Iniciar Examen' : 'Start Exam'} <ArrowRight size={20} />
      </button>
      <button onClick={() => navigate(-1)} className="btn-secondary w-full mt-3">
        {isEs ? 'Volver' : 'Go Back'}
      </button>
    </div>
  )

  // EXAM
  const currentQ  = questions[idx]
  const opts      = currentQ?.question_options?.sort((a, b) => a.order_num - b.order_num) || []
  const answered  = Object.keys(answers).length
  const isFlagged = flagged.has(currentQ?.id)
  const pct       = timeLeft / ((examInfo?.time_minutes || 1) * 60)
  const timeColor = timeLeft < 600 ? 'text-alex-error' : timeLeft < 1800 ? 'text-alex-warning' : 'text-alex-success'

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">

      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-navy-950/90 backdrop-blur-sm border-b border-navy-700
                      -mx-4 px-4 py-3 mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Clock size={16} className={timeColor} />
          <span className={`font-black text-lg font-mono ${timeColor}`}>
            {formatTime(timeLeft)}
          </span>
        </div>

        <div className="flex-1 progress-bar max-w-xs hidden sm:block">
          <div className={`h-full rounded-full transition-all duration-1000
            ${pct > 0.5 ? 'bg-alex-success' : pct > 0.2 ? 'bg-alex-warning' : 'bg-alex-error'}`}
            style={{ width: `${pct * 100}%` }} />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm">{answered}/{questions.length}</span>
          <button onClick={() => setShowNav(s => !s)}
            className="btn-secondary py-2 px-3 text-xs">
            Questions
          </button>
          <button onClick={() => setPhase('confirm')}
            className="btn-primary py-2 px-3 text-xs">
            Submit
          </button>
        </div>
      </div>

      {/* Question navigator panel */}
      {showNav && (
        <div className="card mb-6 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-white text-sm">Question Navigator</p>
            <button onClick={() => setShowNav(false)} className="text-gray-400 text-xs">Close</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, i) => (
              <button key={q.id}
                onClick={() => { setIdx(i); setShowNav(false) }}
                className={`w-9 h-9 rounded-lg text-xs font-bold transition-all
                  ${i === idx            ? 'bg-alex-amber text-navy-900'
                  : flagged.has(q.id)    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                  : answers[q.id]        ? 'bg-alex-success/20 text-alex-success border border-alex-success/30'
                  : 'bg-navy-700 text-gray-400 border border-navy-600'}`}>
                {i + 1}
              </button>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-alex-success/30 inline-block"/> Answered</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-500/30 inline-block"/> Flagged</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-navy-700 inline-block"/> Unanswered</span>
          </div>
        </div>
      )}

      {/* Question */}
      <div className="card mb-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">
              {currentQ?.topic_tag?.replace(/_/g, ' ')} · Q{idx + 1}
            </p>
            <p className="text-white font-semibold text-lg leading-relaxed">
              {isEs ? currentQ?.question_es : currentQ?.question_en}
            </p>
          </div>
          <button onClick={() => toggleFlag(currentQ?.id)}
            className={`flex-shrink-0 p-2 rounded-lg border transition-all
              ${isFlagged
                ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                : 'bg-navy-700 border-navy-600 text-gray-500 hover:text-orange-400'}`}>
            <Flag size={16} />
          </button>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-8">
        {opts.map((opt, i) => {
          const letter     = ['A','B','C','D'][i]
          const isSelected = answers[currentQ?.id] === opt.id
          return (
            <button key={opt.id}
              onClick={() => selectAnswer(currentQ.id, opt.id)}
              className={`w-full text-left flex items-start gap-4 p-4 rounded-xl border
                          transition-all duration-150 active:scale-[0.99]
                          ${isSelected
                            ? 'border-alex-amber bg-alex-amber/10'
                            : 'border-navy-700 bg-navy-800 hover:border-alex-amber/30 hover:bg-navy-700'}`}>
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center
                               text-sm font-black flex-shrink-0 transition-colors
                               ${isSelected ? 'bg-alex-amber text-navy-900' : 'bg-navy-700 text-gray-400'}`}>
                {letter}
              </span>
              <span className="text-sm text-gray-200 leading-relaxed pt-1">
                {isEs ? opt.option_text_es : opt.option_text_en}
              </span>
            </button>
          )
        })}
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => setIdx(i => Math.max(0, i-1))}
          disabled={idx === 0}
          className="btn-secondary py-2 px-4 text-sm disabled:opacity-30">
          ← Previous
        </button>
        <span className="text-gray-500 text-sm">{idx+1} of {questions.length}</span>
        {idx < questions.length - 1 ? (
          <button onClick={() => setIdx(i => i+1)}
            className="btn-secondary py-2 px-4 text-sm">
            Next →
          </button>
        ) : (
          <button onClick={() => setPhase('confirm')}
            className="btn-primary py-2 px-4 text-sm">
            Review & Submit
          </button>
        )}
      </div>

      {/* Submit confirmation */}
      {phase === 'confirm' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card max-w-sm w-full animate-bounce-in">
            <h2 className="text-xl font-black text-white mb-2">
              {isEs ? 'Enviar Examen' : 'Submit Exam'}
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              {answered < questions.length
                ? `⚠️ You have ${questions.length - answered} unanswered questions. Are you sure?`
                : 'You answered all questions. Ready to submit?'
              }
            </p>
            <div className="grid grid-cols-3 gap-3 mb-6 text-center">
              <div><p className="text-xl font-black text-alex-success">{answered}</p><p className="text-xs text-gray-500">Answered</p></div>
              <div><p className="text-xl font-black text-orange-400">{flagged.size}</p><p className="text-xs text-gray-500">Flagged</p></div>
              <div><p className="text-xl font-black text-gray-400">{questions.length - answered}</p><p className="text-xs text-gray-500">Skipped</p></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPhase('exam')} className="btn-secondary flex-1">
                {isEs ? 'Revisar' : 'Keep Reviewing'}
              </button>
              <button onClick={submitExam} className="btn-primary flex-1">
                {isEs ? 'Enviar' : 'Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

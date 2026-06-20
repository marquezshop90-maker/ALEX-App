import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Brain, Trophy } from 'lucide-react'

export default function ExamResults() {
  const { sessionId } = useParams()
  const location      = useLocation()
  const navigate      = useNavigate()
  const { i18n }      = useTranslation()
  const { user }      = useAuthStore()
  const isEs          = i18n.language === 'ES'

  const state = location.state || {}
  const { answers = [], score = 0, passed = false, total = 0, correct = 0 } = state

  const [aiTip, setAiTip]     = useState('')
  const [loadingAI, setLoadingAI] = useState(false)
  const [moduleId, setModuleId]   = useState(null)
  const [examCode, setExamCode]   = useState('BL')

  useEffect(() => {
    // Get session info for module path
    const getSession = async () => {
      if (!sessionId || sessionId === 'local') return
      const { data } = await supabase
        .from('exam_sessions')
        .select('module_id, exam_types(code)')
        .eq('id', sessionId).maybeSingle()
      if (data) {
        setModuleId(data.module_id)
        setExamCode(data.exam_types?.code || 'BL')
      }
    }
    getSession()

    // Generate AI tip for wrong answers
    if (answers.length > 0) generateAITip()
  }, [sessionId])

  const generateAITip = async () => {
    const wrong = answers.filter(a => !a.correct)
    if (wrong.length === 0) return

    setLoadingAI(true)
    try {
      const wrongTopics = [...new Set(wrong.map(a => a.questionEn?.slice(0, 80)))].slice(0, 3)
      const prompt = `A contractor exam student answered ${wrong.length} questions incorrectly.
Wrong questions topics: ${wrongTopics.join('; ')}.
Give 2-3 specific, practical study tips in 3 sentences max. Be direct and encouraging.`

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 200,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data = await res.json()
      setAiTip(data.content?.[0]?.text || '')
    } catch (err) {
      console.error('AI tip error:', err)
    } finally {
      setLoadingAI(false)
    }
  }

  const basePath = examCode === 'BL' ? '/bl' : '/trade'

  return (
    <div className="max-w-2xl mx-auto animate-fade-in py-4">

      {/* Score card */}
      <div className={`card text-center mb-6 border-2
        ${passed ? 'border-alex-success/40 bg-alex-success/5' : 'border-alex-error/40 bg-alex-error/5'}`}>
        <div className="text-5xl mb-4">{passed ? '🏆' : '📚'}</div>
        <h1 className="text-4xl font-black text-white mb-1">{score}%</h1>
        <p className={`text-lg font-bold mb-2 ${passed ? 'text-alex-success' : 'text-alex-error'}`}>
          {passed
            ? (isEs ? '¡Módulo Aprobado!' : 'Module Passed!')
            : (isEs ? 'Sigue Estudiando'  : 'Keep Studying')}
        </p>
        <p className="text-gray-400 text-sm">
          {correct} / {total} correct · {passed ? 'Pass' : 'Need 80% to pass'}
        </p>

        {/* Score bar */}
        <div className="progress-bar mt-4">
          <div
            className={`h-full rounded-full transition-all duration-700
              ${passed ? 'bg-alex-success' : 'bg-alex-error'}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>0%</span>
          <span className="text-alex-amber">80% to pass</span>
          <span>100%</span>
        </div>
      </div>

      {/* AI Study Tip */}
      {(loadingAI || aiTip) && !passed && (
        <div className="card border-alex-blue/30 bg-alex-blue/5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={18} className="text-blue-400" />
            <span className="font-bold text-white text-sm">AI Study Tip</span>
            {loadingAI && (
              <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin ml-1" />
            )}
          </div>
          {aiTip && <p className="text-gray-300 text-sm leading-relaxed">{aiTip}</p>}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 mb-8">
        {!passed && moduleId && (
          <button
            onClick={() => navigate(`${basePath}/mini-exam/${moduleId}`)}
            className="flex-1 btn-secondary flex items-center justify-center gap-2">
            <RotateCcw size={16} />
            {isEs ? 'Intentar de nuevo' : 'Try Again'}
          </button>
        )}
        {moduleId && (
          <button
            onClick={() => navigate(`${basePath}/modules/${moduleId}`)}
            className="flex-1 btn-primary flex items-center justify-center gap-2">
            {passed
              ? (isEs ? 'Siguiente módulo' : 'Next Module')
              : (isEs ? 'Repasar lecciones' : 'Review Lessons')}
            <ArrowRight size={16} />
          </button>
        )}
        {!moduleId && (
          <button onClick={() => navigate('/dashboard')}
            className="flex-1 btn-primary flex items-center justify-center gap-2">
            Dashboard <ArrowRight size={16} />
          </button>
        )}
      </div>

      {/* Answer review */}
      {answers.length > 0 && (
        <div>
          <h2 className="font-bold text-white text-lg mb-4">
            {isEs ? 'Revisión de Respuestas' : 'Answer Review'}
          </h2>
          <div className="space-y-4">
            {answers.map((ans, i) => (
              <div key={i}
                className={`card border-l-4
                  ${ans.correct ? 'border-alex-success' : 'border-alex-error'}`}>
                <div className="flex items-start gap-3 mb-3">
                  {ans.correct
                    ? <CheckCircle2 size={16} className="text-alex-success flex-shrink-0 mt-0.5" />
                    : <XCircle     size={16} className="text-alex-error   flex-shrink-0 mt-0.5" />
                  }
                  <p className="text-white text-sm font-semibold leading-relaxed">
                    {i + 1}. {isEs ? ans.questionEs : ans.questionEn}
                  </p>
                </div>

                {/* Selected and correct options */}
                {!ans.correct && (
                  <div className="space-y-2 mb-3 pl-7">
                    {ans.options?.map(opt => {
                      const isSelected = opt.id === ans.selectedId
                      const isRight    = opt.is_correct
                      if (!isSelected && !isRight) return null
                      return (
                        <div key={opt.id}
                          className={`flex items-start gap-2 text-xs p-2 rounded-lg
                            ${isRight    ? 'bg-alex-success/10 text-alex-success'
                            : isSelected ? 'bg-alex-error/10 text-red-400'
                            : ''}`}>
                          {isRight    ? <CheckCircle2 size={12} className="mt-0.5 flex-shrink-0" />
                           : isSelected ? <XCircle     size={12} className="mt-0.5 flex-shrink-0" />
                           : null}
                          <span>{isEs ? opt.option_text_es : opt.option_text_en}</span>
                          <span className="ml-auto font-semibold flex-shrink-0">
                            {isRight ? 'Correct' : 'Your answer'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Explanation */}
                <div className="pl-7">
                  <p className="text-gray-400 text-xs leading-relaxed">
                    <span className="text-gray-500 font-semibold">Explanation: </span>
                    {isEs ? ans.explanationEs : ans.explanationEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

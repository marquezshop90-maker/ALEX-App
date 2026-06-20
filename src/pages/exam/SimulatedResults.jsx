import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, XCircle, Clock, Trophy, RotateCcw, ArrowRight, TrendingUp } from 'lucide-react'

function formatTime(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s%3600)/60), sec = s%60
  if (h > 0) return `${h}h ${m}m ${sec}s`
  return `${m}m ${sec}s`
}

export default function SimulatedResults() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { i18n }  = useTranslation()
  const isEs      = i18n.language === 'ES'

  const {
    answers = [], score = 0, passed = false,
    total = 0, correct = 0, timeUsed = 0, examName = ''
  } = location.state || {}

  // Group wrong answers by topic
  const wrongByTopic = {}
  answers.filter(a => !a.correct).forEach(a => {
    const tag = a.topicTag || 'General'
    if (!wrongByTopic[tag]) wrongByTopic[tag] = 0
    wrongByTopic[tag]++
  })
  const weakTopics = Object.entries(wrongByTopic)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div className="max-w-2xl mx-auto animate-fade-in py-4">

      {/* Hero result */}
      <div className={`card text-center mb-6 border-2
        ${passed ? 'border-alex-success/50 bg-alex-success/5' : 'border-alex-error/50 bg-alex-error/5'}`}>
        <div className="text-6xl mb-4">{passed ? '🏆' : '📖'}</div>
        <h1 className="text-5xl font-black text-white mb-2">{score}%</h1>
        <p className={`text-xl font-black mb-1 ${passed ? 'text-alex-success' : 'text-alex-error'}`}>
          {passed
            ? (isEs ? '¡Examen Aprobado!' : 'Exam Passed!')
            : (isEs ? 'No Aprobado' : 'Not Passed')}
        </p>
        <p className="text-gray-400 text-sm">{examName}</p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-navy-700">
          <div>
            <p className="text-2xl font-black text-alex-success">{correct}</p>
            <p className="text-xs text-gray-400 mt-1">Correct</p>
          </div>
          <div>
            <p className="text-2xl font-black text-alex-error">{total - correct}</p>
            <p className="text-xs text-gray-400 mt-1">Wrong</p>
          </div>
          <div>
            <p className="text-2xl font-black text-blue-400">{formatTime(timeUsed)}</p>
            <p className="text-xs text-gray-400 mt-1">Time used</p>
          </div>
        </div>

        {/* Score bar */}
        <div className="mt-6 progress-bar">
          <div className={`h-full rounded-full transition-all duration-1000
            ${passed ? 'bg-alex-success' : 'bg-alex-error'}`}
            style={{ width: `${score}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1.5 px-0.5">
          <span>0%</span>
          <span className="text-alex-amber font-semibold">72% passing</span>
          <span>100%</span>
        </div>
      </div>

      {/* Weak areas */}
      {weakTopics.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-alex-warning" />
            <h2 className="font-bold text-white">
              {isEs ? 'Áreas a Reforzar' : 'Areas to Strengthen'}
            </h2>
          </div>
          <div className="space-y-3">
            {weakTopics.map(([topic, count]) => {
              const topicTotal = answers.filter(a => a.topicTag === topic).length
              const failPct    = Math.round((count / topicTotal) * 100)
              return (
                <div key={topic}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">{topic.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-alex-error font-bold">{count} wrong ({failPct}%)</span>
                  </div>
                  <div className="progress-bar">
                    <div className="h-full rounded-full bg-alex-error transition-all duration-700"
                         style={{ width: `${failPct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          {!passed && (
            <p className="text-gray-500 text-xs mt-4 leading-relaxed">
              {isEs
                ? 'Regresa a estos módulos y repasa las lecciones y flashcards antes de intentarlo nuevamente.'
                : 'Go back to these modules and review the lessons and flashcards before trying again.'}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mb-8">
        {!passed && (
          <button onClick={() => navigate(-1)}
            className="flex-1 btn-secondary flex items-center justify-center gap-2">
            <RotateCcw size={16} />
            {isEs ? 'Intentar de nuevo' : 'Try Again'}
          </button>
        )}
        <button onClick={() => navigate('/dashboard')}
          className="flex-1 btn-primary flex items-center justify-center gap-2">
          {passed
            ? (isEs ? '¡Ir al Dashboard!' : 'Go to Dashboard!')
            : (isEs ? 'Estudiar más'      : 'Keep Studying')}
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Full answer review */}
      <div>
        <h2 className="font-bold text-white text-lg mb-4">
          {isEs ? 'Revisión Completa' : 'Full Review'}
        </h2>
        <div className="space-y-3">
          {answers.map((ans, i) => (
            <div key={i}
              className={`card border-l-4 ${ans.correct ? 'border-alex-success' : 'border-alex-error'}`}>
              <div className="flex items-start gap-3">
                {ans.correct
                  ? <CheckCircle2 size={15} className="text-alex-success flex-shrink-0 mt-0.5" />
                  : <XCircle     size={15} className="text-alex-error   flex-shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold leading-relaxed mb-2">
                    {i+1}. {isEs ? ans.questionEs : ans.questionEn}
                  </p>
                  {!ans.correct && ans.options && (
                    <div className="space-y-1 mb-2">
                      {ans.options.filter(o => o.is_correct || o.id === ans.selectedId).map(opt => (
                        <div key={opt.id}
                          className={`flex items-center gap-2 text-xs p-1.5 rounded-lg
                            ${opt.is_correct ? 'text-alex-success bg-alex-success/10' : 'text-red-400 bg-alex-error/10'}`}>
                          {opt.is_correct
                            ? <CheckCircle2 size={11} />
                            : <XCircle     size={11} />}
                          <span>{isEs ? opt.option_text_es : opt.option_text_en}</span>
                          <span className="ml-auto font-bold">
                            {opt.is_correct ? 'Correct' : 'Your answer'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-gray-500 text-xs leading-relaxed">
                    {isEs ? ans.explanationEs : ans.explanationEn}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

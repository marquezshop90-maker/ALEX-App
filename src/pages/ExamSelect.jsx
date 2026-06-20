import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { ArrowRight, CheckCircle2, Lock } from 'lucide-react'

export default function ExamSelect() {
  const { t, i18n } = useTranslation()
  const { user, isPremium } = useAuthStore()
  const isEs = i18n.language === 'ES'

  const [progress, setProgress] = useState({ BL: { done: 0, total: 13 }, TRADE: { done: 0, total: 18 } })

  useEffect(() => {
    const load = async () => {
      if (!user) return
      try {
        const [blRes, tradeRes, blProg, tradeProg] = await Promise.all([
          supabase.from('exam_types').select('id').eq('code', 'BL').single(),
          supabase.from('exam_types').select('id').eq('code', 'TRADE').single(),
          supabase.from('user_module_progress').select('status, modules(exam_types(code))')
            .eq('user_id', user.id).eq('status', 'completed'),
          supabase.from('modules').select('id', { count: 'exact' }).eq('is_active', true),
        ])
        const blDone    = (blProg.data || []).filter(m => m.modules?.exam_types?.code === 'BL').length
        const tradeDone = (blProg.data || []).filter(m => m.modules?.exam_types?.code === 'TRADE').length
        setProgress({ BL: { done: blDone, total: 13 }, TRADE: { done: tradeDone, total: 18 } })
      } catch (err) {
        console.error('ExamSelect load error:', err)
      }
    }
    load()
  }, [user])

  const exams = [
    {
      code: 'BL', icon: '⚖️', path: '/bl/modules',
      name: 'Business & Law',
      nameEs: 'Business & Law',
      desc: '100 questions · 2.5 hours · 72% to pass',
      descEs: '100 preguntas · 2.5 horas · 72% para aprobar',
      modules: 13,
      color: 'border-alex-blue/40 hover:border-alex-blue/70',
      iconBg: 'bg-alex-blue/10',
      barColor: 'bg-alex-blue',
      topics: ['CSLB Licensing', 'Contracts', 'Lien Law', 'Labor Law', 'Insurance', 'Taxes', 'Safety'],
      topicsEs: ['Licencias CSLB', 'Contratos', 'Ley de Gravámenes', 'Ley Laboral', 'Seguros', 'Impuestos', 'Seguridad'],
    },
    {
      code: 'TRADE', icon: '🏗️', path: '/trade/modules',
      name: 'Trade (Class B)',
      nameEs: 'Trade (Clase B)',
      desc: '115 questions · 3.5 hours · 72% to pass',
      descEs: '115 preguntas · 3.5 horas · 72% para aprobar',
      modules: 18,
      color: 'border-alex-success/40 hover:border-alex-success/70',
      iconBg: 'bg-alex-success/10',
      barColor: 'bg-alex-success',
      topics: ['Building Code', 'Blueprint Reading', 'Foundations', 'Framing', 'Plumbing', 'Electrical', 'HVAC'],
      topicsEs: ['Código de Construcción', 'Lectura de Planos', 'Cimentaciones', 'Encuadre', 'Plomería', 'Eléctrico', 'HVAC'],
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-white">
          {isEs ? 'Selecciona tu Examen' : 'Choose Your Exam'}
        </h1>
        <p className="text-gray-400 mt-2">
          {isEs
            ? 'Necesitas aprobar ambos para obtener tu licencia Clase B.'
            : 'You need to pass both exams to get your Class B license.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exams.map(exam => {
          const prog = progress[exam.code]
          const pct  = Math.round((prog.done / prog.total) * 100)
          return (
            <Link key={exam.code} to={exam.path}
              className={`card border-2 transition-all duration-200 group flex flex-col ${exam.color}`}>
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div className={`w-14 h-14 rounded-2xl ${exam.iconBg} flex items-center justify-center text-3xl`}>
                  {exam.icon}
                </div>
                <span className="text-xs text-gray-500 bg-navy-700 px-2 py-1 rounded-full">
                  {exam.modules} {isEs ? 'módulos' : 'modules'}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-xl font-black text-white mb-1">
                {isEs ? exam.nameEs : exam.name}
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                {isEs ? exam.descEs : exam.desc}
              </p>

              {/* Topics */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {(isEs ? exam.topicsEs : exam.topics).map(topic => (
                  <span key={topic}
                    className="text-xs bg-navy-700 text-gray-400 px-2 py-0.5 rounded-full">
                    {topic}
                  </span>
                ))}
              </div>

              {/* Progress */}
              <div className="mt-auto">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-500">{prog.done}/{prog.total} complete</span>
                  <span className="text-xs font-bold text-white">{pct}%</span>
                </div>
                <div className="progress-bar mb-4">
                  <div className={`h-full rounded-full ${exam.barColor} transition-all duration-700`}
                       style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-alex-amber text-sm font-bold group-hover:gap-3 transition-all">
                    {pct === 0
                      ? (isEs ? 'Empezar →' : 'Start studying →')
                      : pct === 100
                        ? (isEs ? 'Repasar →' : 'Review →')
                        : (isEs ? 'Continuar →' : 'Continue →')}
                  </span>
                  <ArrowRight size={16} className="text-gray-600 group-hover:text-alex-amber
                                                    group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Info box */}
      <div className="card border-alex-blue/20 bg-alex-blue/5">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          💡 {isEs ? 'Consejo' : 'Study Tip'}
        </h3>
        <p className="text-gray-300 text-sm leading-relaxed">
          {isEs
            ? 'La mayoría de los estudiantes recomiendan empezar con Business & Law — cubre los fundamentos legales y administrativos que también aparecen en el Trade exam.'
            : 'Most students recommend starting with Business & Law — it covers legal and administrative fundamentals that also appear in the Trade exam.'}
        </p>
      </div>
    </div>
  )
}

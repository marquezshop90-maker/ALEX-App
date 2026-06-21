import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import {
  CheckCircle2, Star, Zap, BookOpen, Brain,
  BarChart2, Shield, Heart, ArrowLeft, Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Interactive Flashcards',
    titleEs: 'Flashcards Interactivas',
    desc: 'Memorize key concepts with spaced-repetition flashcards for all 31 modules.',
    descEs: 'Memoriza conceptos clave con flashcards de repetición espaciada para los 31 módulos.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    icon: Zap,
    title: 'Mini-Exams per Module',
    titleEs: 'Mini-Exámenes por Módulo',
    desc: 'Test your knowledge after each module with targeted practice questions.',
    descEs: 'Pon a prueba tus conocimientos después de cada módulo con preguntas de práctica.',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
  },
  {
    icon: Brain,
    title: 'AI Study Tips',
    titleEs: 'Consejos de Estudio con IA',
    desc: 'Get personalized AI-powered tips based on your weak areas after each exam.',
    descEs: 'Obtén consejos personalizados con IA basados en tus áreas débiles después de cada examen.',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
  },
  {
    icon: Shield,
    title: 'Full Simulation Exams',
    titleEs: 'Exámenes Simulados Completos',
    desc: 'Take full-length timed exams that mirror the real CSLB test experience.',
    descEs: 'Toma exámenes cronometrados completos que replican la experiencia real del CSLB.',
    color: 'text-green-400',
    bg: 'bg-green-400/10',
  },
  {
    icon: BarChart2,
    title: 'Performance Analytics',
    titleEs: 'Análisis de Rendimiento',
    desc: 'Track your progress, streaks, and identify weak areas across all modules.',
    descEs: 'Rastrea tu progreso, rachas e identifica áreas débiles en todos los módulos.',
    color: 'text-red-400',
    bg: 'bg-red-400/10',
  },
  {
    icon: Star,
    title: 'All 31 Study Modules',
    titleEs: 'Los 31 Módulos de Estudio',
    desc: 'Complete coverage of Business & Law and Trade (Class B) exam content.',
    descEs: 'Cobertura completa del examen de Business & Law y Trade (Clase B).',
    color: 'text-alex-amber',
    bg: 'bg-alex-amber/10',
  },
]

export default function Upgrade() {
  const { i18n } = useTranslation()
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  const isEs = i18n.language === 'ES'

  const isPremium = profile?.subscription_type === 'premium' || profile?.role === 'super_admin'

  const handleUpgrade = () => {
    toast('Stripe integration coming soon! We will notify you when payments are live.', {
      icon: '🚧',
      duration: 4000,
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-12">

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
      >
        <ArrowLeft size={16} />
        {isEs ? 'Volver' : 'Back'}
      </button>

      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
             style={{ background: 'linear-gradient(135deg, #1E40AF, #F59E0B)' }}>
          <Sparkles size={28} className="text-white" />
        </div>
        <h1 className="text-4xl font-black text-white">
          {isEs ? 'Hazte Premium' : 'Go Premium'}
        </h1>
        <p className="text-gray-400 text-lg leading-relaxed max-w-md mx-auto">
          {isEs
            ? 'Todo lo que necesitas para pasar el examen de licencia de contratista de California.'
            : 'Everything you need to pass the California Contractor License exam.'}
        </p>
      </div>

      {/* Price card */}
      <div className="card border border-alex-amber/30 bg-alex-amber/5 text-center">
        <div className="flex items-end justify-center gap-2 mb-2">
          <span className="text-5xl font-black text-alex-amber">$29</span>
          <span className="text-2xl font-black text-alex-amber">.00</span>
          <span className="text-gray-400 text-lg mb-1">{isEs ? '/mes' : '/month'}</span>
        </div>
        <p className="text-gray-500 text-sm">
          {isEs ? 'Cancela cuando quieras · Sin contratos' : 'Cancel anytime · No contracts'}
        </p>

        {isPremium ? (
          <div className="mt-6 flex items-center justify-center gap-2 text-green-400 font-bold">
            <CheckCircle2 size={20} />
            {isEs ? '¡Ya eres Premium!' : "You're already Premium!"}
          </div>
        ) : (
          <button
            onClick={handleUpgrade}
            className="btn-primary w-full mt-6 py-4 text-base font-bold flex items-center justify-center gap-2"
          >
            <Star size={18} fill="currentColor" />
            {isEs ? 'Obtener Premium — $29.00/mes' : 'Get Premium — $29.00/mo'}
          </button>
        )}
      </div>

      {/* Features */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">
          {isEs ? 'Todo lo que incluye' : "Everything that's included"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="card flex gap-3 items-start">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${f.bg}`}>
                  <Icon size={16} className={f.color} />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{isEs ? f.titleEs : f.title}</p>
                  <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                    {isEs ? f.descEs : f.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Community support message */}
      <div className="card border border-blue-500/20 bg-blue-500/5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <Heart size={18} className="text-red-400" fill="currentColor" />
          </div>
          <div>
            <p className="font-bold text-white mb-2">
              {isEs ? 'Más que una app de estudio' : 'More than a study app'}
            </p>
            <p className="text-gray-400 text-sm leading-relaxed">
              {isEs
                ? 'ALEX es parte de un proyecto más grande: construir herramientas accesibles para contratistas latinos en los Estados Unidos. Tu suscripción nos ayuda a seguir desarrollando aplicaciones gratuitas como esta — para que más personas en nuestra comunidad puedan crecer, obtener sus licencias y construir negocios exitosos. Gracias por ser parte de esto.'
                : 'ALEX is part of a larger mission: building accessible tools for Latino contractors in the United States. Your subscription helps us keep developing free apps like this one — so more people in our community can grow, get their licenses, and build successful businesses. Thank you for being part of this.'}
            </p>
            <p className="text-blue-400 text-sm font-medium mt-3">
              — Deybi Marquez, {isEs ? 'Fundador' : 'Founder'} · Marquez Project Solutions LLC
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="card space-y-4">
        <h2 className="font-bold text-white">
          {isEs ? 'Preguntas frecuentes' : 'Frequently asked questions'}
        </h2>
        {[
          {
            q: isEs ? '¿Puedo cancelar en cualquier momento?' : 'Can I cancel at any time?',
            a: isEs
              ? 'Sí. Puedes cancelar tu suscripción en cualquier momento sin penalidades. Mantendrás el acceso premium hasta el final del período pagado.'
              : 'Yes. You can cancel your subscription at any time with no penalties. You keep premium access until the end of your paid period.',
          },
          {
            q: isEs ? '¿Cuánto tiempo tarda la preparación?' : 'How long does exam prep take?',
            a: isEs
              ? 'La mayoría de los estudiantes completan la preparación en 4-8 semanas estudiando 1-2 horas por día. ALEX se adapta a tu ritmo.'
              : 'Most students complete exam prep in 4-8 weeks studying 1-2 hours per day. ALEX adapts to your pace.',
          },
          {
            q: isEs ? '¿Está disponible en español?' : 'Is it available in Spanish?',
            a: isEs
              ? 'Sí. Toda la app — lecciones, flashcards, preguntas y exámenes — está disponible en inglés y español.'
              : 'Yes. The entire app — lessons, flashcards, questions and exams — is available in both English and Spanish.',
          },
        ].map((item, i) => (
          <div key={i} className="border-b border-navy-700 last:border-0 pb-4 last:pb-0">
            <p className="font-medium text-white text-sm mb-1">{item.q}</p>
            <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      {!isPremium && (
        <button
          onClick={handleUpgrade}
          className="btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2"
        >
          <Star size={18} fill="currentColor" />
          {isEs ? 'Obtener Premium — $29.00/mes' : 'Get Premium — $29.00/mo'}
        </button>
      )}
    </div>
  )
}

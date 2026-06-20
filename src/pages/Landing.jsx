import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Star, ArrowRight, BookOpen, Brain, BarChart3, Shield } from 'lucide-react'

const features = [
  { icon: BookOpen, title: 'All 31 Study Modules', titleEs: '31 Módulos de Estudio', desc: 'Complete content for Business & Law and Trade exams. Theory, references, and official CSLB links.', descEs: 'Contenido completo para los exámenes de Business & Law y Trade. Teoría, referencias y enlaces CSLB oficiales.' },
  { icon: Brain, title: 'AI-Powered Tutoring', titleEs: 'Tutoría con Inteligencia Artificial', desc: 'Our AI identifies your weak areas and generates targeted practice questions to reinforce learning.', descEs: 'Nuestra IA identifica tus áreas débiles y genera preguntas de práctica dirigidas para reforzar el aprendizaje.' },
  { icon: BarChart3, title: 'Full Simulation Exams', titleEs: 'Exámenes Simulados Completos', desc: 'Timed simulation exams that mirror real CSLB conditions. 100 questions for B&L, 115 for Trade.', descEs: 'Exámenes simulados cronometrados que reflejan las condiciones reales del CSLB. 100 preguntas para B&L, 115 para Trade.' },
  { icon: Shield, title: 'Always Up to Date', titleEs: 'Siempre Actualizado', desc: 'We track CSLB requirement changes and update content with alerts when regulations change.', descEs: 'Rastreamos los cambios de requisitos del CSLB y actualizamos el contenido con alertas cuando cambian las regulaciones.' },
]

const plans = [
  {
    name: 'Free', nameEs: 'Gratis',
    price: '$0', period: 'forever', periodEs: 'para siempre',
    badge: null,
    items: ['All 31 study modules', 'Official CSLB references', 'Bilingual EN / ES', 'Progress tracking'],
    itemsEs: ['31 módulos de estudio', 'Referencias CSLB oficiales', 'Bilingüe EN / ES', 'Seguimiento de progreso'],
    cta: 'Get Started Free', ctaEs: 'Empezar Gratis',
    primary: false,
  },
  {
    name: 'Premium', nameEs: 'Premium',
    price: '$29.99', period: '/month', periodEs: '/mes',
    badge: 'Most Popular',
    items: ['Everything in Free', 'Interactive flashcards', 'Mini-exams after each module', 'AI tutor & weak area analysis', 'Full simulation exams (B&L + Trade)', 'Detailed performance reports'],
    itemsEs: ['Todo lo de Gratis', 'Flashcards interactivas', 'Mini-exámenes por módulo', 'Tutor IA y análisis de áreas débiles', 'Exámenes simulados completos (B&L + Trade)', 'Reportes detallados de desempeño'],
    cta: 'Start Premium', ctaEs: 'Iniciar Premium',
    primary: true,
  },
]

export default function Landing() {
  const { t, i18n } = useTranslation()
  const isEs = i18n.language === 'ES'

  return (
    <div className="bg-navy-900">

      {/* HERO */}
      <section className="min-h-[90vh] flex items-center justify-center px-4 py-20 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]
                        rounded-full bg-alex-blue/10 blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-20 w-32 h-32 rounded-full bg-alex-amber/10 blur-2xl pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10 animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-alex-amber/10
                          border border-alex-amber/20 text-alex-amber text-sm font-semibold mb-8">
            <span>🏗️</span>
            California Contractor License Class B
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
            Pass Your<br />
            <span className="text-gradient-amber">Contractor Exam</span><br />
            First Try.
          </h1>

          <p className="text-xl text-gray-300 max-w-xl mx-auto mb-10 leading-relaxed">
            {isEs
              ? 'ALEX cubre los 31 módulos del examen General B — Business & Law y Trade — con tutoría de IA, flashcards y exámenes simulados.'
              : 'ALEX covers all 31 modules for the Class B exam — Business & Law and Trade — with AI tutoring, flashcards, and simulation exams.'}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register"
              className="btn-primary flex items-center justify-center gap-2 text-lg px-8 py-4">
              {isEs ? 'Crear Cuenta Gratis' : 'Create Free Account'}
              <ArrowRight size={20} />
            </Link>
            <Link to="/login"
              className="btn-secondary flex items-center justify-center text-lg px-8 py-4">
              {isEs ? 'Ya tengo cuenta' : 'I have an account'}
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-6 mt-12 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-alex-success" />
              {isEs ? 'Sin tarjeta requerida' : 'No credit card required'}
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-alex-success" />
              {isEs ? 'Contenido bilingüe EN/ES' : 'Bilingual EN/ES content'}
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-alex-success" />
              {isEs ? 'Siempre actualizado' : 'Always up to date'}
            </div>
          </div>
        </div>
      </section>

      {/* EXAM INFO BAND */}
      <section className="border-y border-navy-700 bg-navy-800/50 py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-5 p-5 rounded-2xl bg-navy-800 border border-navy-700">
            <div className="w-12 h-12 rounded-xl bg-alex-blue/20 flex items-center justify-center text-2xl flex-shrink-0">⚖️</div>
            <div>
              <p className="font-bold text-white text-lg">Business & Law</p>
              <p className="text-gray-400 text-sm">100 questions · 2.5 hours · 72% to pass · 13 modules</p>
            </div>
          </div>
          <div className="flex items-center gap-5 p-5 rounded-2xl bg-navy-800 border border-navy-700">
            <div className="w-12 h-12 rounded-xl bg-alex-success/20 flex items-center justify-center text-2xl flex-shrink-0">🏗️</div>
            <div>
              <p className="font-bold text-white text-lg">Trade (Class B)</p>
              <p className="text-gray-400 text-sm">115 questions · 3.5 hours · 72% to pass · 18 modules</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">
              {isEs ? 'Todo lo que necesitas para aprobar' : 'Everything you need to pass'}
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              {isEs
                ? 'No más estudiar de PDFs desactualizados. ALEX te da estructura, contenido y práctica real.'
                : 'No more studying from outdated PDFs. ALEX gives you structure, content, and real practice.'}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map(({ icon: Icon, title, titleEs, desc, descEs }) => (
              <div key={title} className="card flex gap-5 group hover:border-alex-amber/30 transition-all duration-200">
                <div className="w-12 h-12 rounded-xl bg-alex-amber/10 border border-alex-amber/20
                                flex items-center justify-center flex-shrink-0 group-hover:bg-alex-amber/20 transition-colors">
                  <Icon size={22} className="text-alex-amber" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-2">{isEs ? titleEs : title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{isEs ? descEs : desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-24 px-4 bg-navy-800/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">
              {isEs ? 'Elige tu plan' : 'Choose your plan'}
            </h2>
            <p className="text-gray-400">
              {isEs
                ? 'Empieza gratis. Mejora cuando estés listo para los exámenes.'
                : 'Start free. Upgrade when you\'re ready to practice exams.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map(plan => (
              <div key={plan.name}
                className={`card relative flex flex-col ${plan.primary
                  ? 'border-alex-amber/50 bg-navy-800'
                  : 'border-navy-700'}`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="badge-premium flex items-center gap-1">
                      <Star size={10} fill="currentColor" /> {plan.badge}
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <p className="font-bold text-white text-lg">{isEs ? plan.nameEs : plan.name}</p>
                  <div className="flex items-end gap-1 mt-2">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-gray-400 mb-1">{isEs ? plan.periodEs : plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 flex-1 mb-6">
                  {(isEs ? plan.itemsEs : plan.items).map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-300">
                      <CheckCircle2 size={16} className="text-alex-success flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to="/register"
                  className={plan.primary ? 'btn-primary w-full text-center' : 'btn-secondary w-full text-center'}>
                  {isEs ? plan.ctaEs : plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-navy-700 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #1E40AF, #F59E0B)' }}>
              <span className="text-sm font-black text-white">A</span>
            </div>
            <div>
              <p className="font-black text-white text-sm">ALEX — Achieve the EXam</p>
              <p className="text-gray-500 text-xs">by Marquez Project Solutions LLC</p>
            </div>
          </div>
          <p className="text-gray-600 text-xs text-center">
            © {new Date().getFullYear()} Marquez Project Solutions LLC · Sacramento, CA ·{' '}
            Not affiliated with CSLB
          </p>
        </div>
      </footer>
    </div>
  )
}

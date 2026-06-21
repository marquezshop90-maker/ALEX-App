import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import {
  CheckCircle2, Star, Zap, BookOpen, Brain,
  BarChart2, Shield, Heart, ArrowLeft, Sparkles, Clock, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

const FEATURES = [
  { icon: BookOpen, title: 'Interactive Flashcards',   titleEs: 'Flashcards Interactivas',     desc: 'Memorize key concepts for all 31 modules.',             descEs: 'Memoriza conceptos clave para los 31 módulos.',           color: 'text-blue-400',   bg: 'bg-blue-400/10' },
  { icon: Zap,      title: 'Mini-Exams per Module',    titleEs: 'Mini-Exámenes por Módulo',    desc: 'Targeted practice questions after each module.',        descEs: 'Preguntas de práctica después de cada módulo.',           color: 'text-amber-400',  bg: 'bg-amber-400/10' },
  { icon: Brain,    title: 'AI Study Tips',            titleEs: 'Consejos de Estudio con IA', desc: 'Personalized tips based on your weak areas.',           descEs: 'Consejos personalizados según tus áreas débiles.',        color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { icon: Shield,   title: 'Full Simulation Exams',    titleEs: 'Exámenes Simulados',          desc: 'Full-length timed exams mirroring the real CSLB test.', descEs: 'Exámenes cronometrados que replican el CSLB real.',       color: 'text-green-400',  bg: 'bg-green-400/10' },
  { icon: BarChart2,title: 'Performance Analytics',    titleEs: 'Análisis de Rendimiento',     desc: 'Track progress and identify weak areas.',               descEs: 'Rastrea tu progreso e identifica áreas débiles.',         color: 'text-red-400',    bg: 'bg-red-400/10' },
  { icon: Star,     title: 'All 31 Study Modules',     titleEs: 'Los 31 Módulos de Estudio',   desc: 'Business & Law and Trade (Class B) full coverage.',     descEs: 'Cobertura completa de Business & Law y Trade Clase B.',   color: 'text-alex-amber', bg: 'bg-alex-amber/10' },
]

export default function Upgrade() {
  const { i18n } = useTranslation()
  const { user, profile, isPremium } = useAuthStore()
  const navigate = useNavigate()
  const isEs = i18n.language === 'ES'
  const [daysLeft, setDaysLeft] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (profile?.trial_ends_at) {
      const diff = Math.ceil(
        (new Date(profile.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24)
      )
      setDaysLeft(diff > 0 ? diff : 0)
    }
  }, [profile])

  const isFullPremium = isPremium() && !profile?.trial_ends_at
  const isTrial = daysLeft !== null && daysLeft > 0 && isPremium()

  const handleCheckout = async () => {
    if (!user) { navigate('/login'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'No URL returned')
      }
    } catch (err) {
      console.error(err)
      toast.error(isEs ? 'Error al procesar el pago' : 'Payment error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-12">

      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
        <ArrowLeft size={16} />
        {isEs ? 'Volver' : 'Back'}
      </button>

      {/* Trial urgency banner */}
      {isTrial && (
        <div className="rounded-2xl border border-orange-500/40 bg-orange-500/10 p-4 flex items-center gap-3">
          <Clock size={20} className="text-orange-400 flex-shrink-0" />
          <div>
            <p className="font-bold text-white text-sm">
              {isEs
                ? `⏳ Tu prueba Premium termina en ${daysLeft} día${daysLeft === 1 ? '' : 's'}`
                : `⏳ Your Premium trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
            </p>
            <p className="text-orange-300 text-xs mt-0.5">
              {isEs
                ? 'Haz upgrade ahora para no perder tu acceso completo.'
                : 'Upgrade now to keep your full access.'}
            </p>
          </div>
        </div>
      )}

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
        <div className="inline-flex items-center gap-1.5 bg-alex-amber/20 text-alex-amber text-xs font-bold px-3 py-1 rounded-full mb-4">
          <Star size={11} fill="currentColor" />
          {isEs ? 'Mejor valor · Solo $3.75/mes' : 'Best value · Only $3.75/mo'}
        </div>

        <div className="flex items-end justify-center gap-2 mb-1">
          <span className="text-6xl font-black text-alex-amber">$45</span>
          <span className="text-gray-400 text-lg mb-2">{isEs ? '/año' : '/year'}</span>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          {isEs
            ? 'Acceso completo por 12 meses · Cancela cuando quieras'
            : 'Full access for 12 months · Cancel anytime'}
        </p>

        {isFullPremium ? (
          <div className="flex items-center justify-center gap-2 text-green-400 font-bold">
            <CheckCircle2 size={20} />
            {isEs ? '¡Ya eres Premium!' : "You're already Premium!"}
          </div>
        ) : (
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> {isEs ? 'Redirigiendo...' : 'Redirecting...'}</>
              : <><Star size={18} fill="currentColor" /> {isEs ? 'Obtener Premium — $45/año' : 'Get Premium — $45/year'}</>
            }
          </button>
        )}

        <p className="text-gray-600 text-xs mt-3">
          🔒 {isEs ? 'Pago seguro con Stripe · Acceso inmediato' : 'Secure payment with Stripe · Instant access'}
        </p>
      </div>

      {/* Free vs Premium comparison */}
      <div className="card overflow-hidden p-0">
        <div className="grid grid-cols-3 text-center">
          <div className="p-4 border-b border-navy-700" />
          <div className="p-4 border-b border-l border-navy-700 bg-navy-700/30">
            <p className="text-gray-400 font-bold text-sm">{isEs ? 'Gratis' : 'Free'}</p>
          </div>
          <div className="p-4 border-b border-l border-navy-700 bg-alex-amber/5">
            <p className="text-alex-amber font-bold text-sm">Premium</p>
          </div>
        </div>
        {[
          { feature: isEs ? '31 lecciones de estudio' : '31 study lessons',        free: true,  premium: true },
          { feature: isEs ? 'Referencias oficiales'   : 'Official references',      free: true,  premium: true },
          { feature: isEs ? 'Bilingüe EN / ES'        : 'Bilingual EN / ES',        free: true,  premium: true },
          { feature: isEs ? 'Flashcards interactivas' : 'Interactive flashcards',   free: false, premium: true },
          { feature: isEs ? 'Mini-exámenes'           : 'Mini-exams',               free: false, premium: true },
          { feature: isEs ? 'Consejos con IA'         : 'AI study tips',            free: false, premium: true },
          { feature: isEs ? 'Exámenes simulados'      : 'Simulation exams',         free: false, premium: true },
          { feature: isEs ? 'Análisis de rendimiento' : 'Performance analytics',    free: false, premium: true },
        ].map((row, i) => (
          <div key={i} className="grid grid-cols-3 text-center border-b border-navy-700 last:border-0">
            <div className="p-3 text-left">
              <p className="text-gray-300 text-xs">{row.feature}</p>
            </div>
            <div className="p-3 border-l border-navy-700 flex items-center justify-center">
              {row.free ? <CheckCircle2 size={16} className="text-green-400" /> : <span className="text-gray-600">—</span>}
            </div>
            <div className="p-3 border-l border-navy-700 bg-alex-amber/5 flex items-center justify-center">
              <CheckCircle2 size={16} className="text-alex-amber" />
            </div>
          </div>
        ))}
      </div>

      {/* Features */}
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
                <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{isEs ? f.descEs : f.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Community message */}
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
                ? 'ALEX es parte de una misión más grande: construir herramientas accesibles para contratistas latinos en los Estados Unidos. Creemos que el acceso a la información no debe costar una fortuna. Tu suscripción de $45 al año nos ayuda a mantener la app y seguir desarrollando herramientas gratuitas para que más personas en nuestra comunidad puedan obtener sus licencias y construir negocios exitosos. Gracias por apoyar este proyecto.'
                : 'ALEX is part of a bigger mission: building accessible tools for Latino contractors in the United States. We believe access to knowledge should not cost a fortune. Your $45/year subscription helps us keep this app running and continue building free tools so more people in our community can get their licenses and build successful businesses. Thank you for supporting this.'}
            </p>
            <p className="text-blue-400 text-sm font-medium mt-3">
              — Deybi Marquez, {isEs ? 'Fundador' : 'Founder'} · Marquez Project Solutions LLC
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="card space-y-4">
        <h2 className="font-bold text-white">{isEs ? 'Preguntas frecuentes' : 'FAQ'}</h2>
        {[
          {
            q: isEs ? '¿Es seguro el pago?' : 'Is the payment secure?',
            a: isEs ? 'Sí. Los pagos son procesados por Stripe, la plataforma de pagos más segura del mundo. Nunca almacenamos tu información de tarjeta.' : 'Yes. Payments are processed by Stripe, the world\'s most trusted payment platform. We never store your card information.',
          },
          {
            q: isEs ? '¿Puedo cancelar en cualquier momento?' : 'Can I cancel anytime?',
            a: isEs ? 'Sí. Puedes cancelar tu suscripción sin penalidades. Mantendrás acceso premium hasta el final del año pagado.' : 'Yes. You can cancel your subscription with no penalties. You keep premium access until the end of your paid year.',
          },
          {
            q: isEs ? '¿Cuánto tiempo tarda la preparación?' : 'How long does prep take?',
            a: isEs ? 'La mayoría completa la preparación en 4-8 semanas. Con $45 tienes un año completo.' : 'Most students complete prep in 4-8 weeks. With $45 you get a full year.',
          },
        ].map((item, i) => (
          <div key={i} className="border-b border-navy-700 last:border-0 pb-4 last:pb-0">
            <p className="font-medium text-white text-sm mb-1">{item.q}</p>
            <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      {!isFullPremium && (
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading
            ? <><Loader2 size={18} className="animate-spin" /> {isEs ? 'Redirigiendo...' : 'Redirecting...'}</>
            : <><Star size={18} fill="currentColor" /> {isEs ? 'Obtener Premium — $45/año' : 'Get Premium — $45/year'}</>
          }
        </button>
      )}
    </div>
  )
}

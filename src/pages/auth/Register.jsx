import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

const PasswordRule = ({ met, label }) => (
  <div className={`flex items-center gap-2 text-xs transition-colors duration-200
    ${met ? 'text-alex-success' : 'text-gray-500'}`}>
    {met ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
    {label}
  </div>
)

// Welcome overlay shown immediately after successful registration
function WelcomeScreen({ name, onContinue }) {
  return (
    <div className="fixed inset-0 z-50 bg-navy-900 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center animate-bounce-in">

        {/* Animated logo */}
        <div className="relative inline-block mb-8">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl mx-auto"
               style={{ background: 'linear-gradient(135deg, #1E40AF, #F59E0B)' }}>
            <span className="text-4xl font-black text-white">A</span>
          </div>
          <div className="absolute -inset-2 rounded-3xl bg-alex-amber/20 blur-xl animate-pulse-slow" />
        </div>

        {/* Message */}
        <h1 className="text-4xl font-black text-white mb-4">
          Welcome, {name}! 🎉
        </h1>

        <div className="space-y-3 mb-8">
          <p className="text-xl text-alex-amber font-bold">
            You just took the most important step.
          </p>
          <p className="text-gray-300 leading-relaxed max-w-md mx-auto">
            Getting your California Contractor License opens doors that most people 
            never walk through. You're already ahead just by being here.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
            ALEX will guide you through every module, every concept, and every 
            practice exam until you're ready to walk in and pass.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-sm mx-auto">
          <div className="card py-4 px-2 text-center">
            <p className="text-2xl font-black text-alex-amber">31</p>
            <p className="text-xs text-gray-400 mt-1">Study Modules</p>
          </div>
          <div className="card py-4 px-2 text-center">
            <p className="text-2xl font-black text-alex-amber">2</p>
            <p className="text-xs text-gray-400 mt-1">Exams Covered</p>
          </div>
          <div className="card py-4 px-2 text-center">
            <p className="text-2xl font-black text-alex-amber">72%</p>
            <p className="text-xs text-gray-400 mt-1">To Pass</p>
          </div>
        </div>

        <button
          onClick={onContinue}
          className="btn-primary flex items-center gap-2 mx-auto px-8 py-4 text-lg"
        >
          Let's Get Started
          <ArrowRight size={20} />
        </button>

        <p className="text-gray-600 text-xs mt-4">
          by Marquez Project Solutions LLC · Sacramento, CA
        </p>
      </div>
    </div>
  )
}

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [welcome, setWelcome]   = useState(null) // name to show in welcome screen
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})

  const pw = form.password
  const rules = {
    length: pw.length >= 8,
    upper:  /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
  }
  const pwValid = Object.values(rules).every(Boolean)

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(er => ({ ...er, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.full_name.trim())         e.full_name = 'Full name is required'
    if (!form.email.includes('@'))      e.email     = 'Enter a valid email'
    if (!pwValid)                       e.password  = 'Password does not meet requirements'
    if (form.password !== form.confirm) e.confirm   = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      // Step 1 — Create account
      const { error: signUpError } = await supabase.auth.signUp({
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        options:  { data: { full_name: form.full_name.trim() } }
      })
      if (signUpError) throw signUpError

      // Step 2 — Sign in immediately (no email verification needed)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      })
      if (signInError) throw signInError

      // Step 3 — Show welcome screen
      const firstName = form.full_name.trim().split(' ')[0]
      setWelcome(firstName)

    } catch (err) {
      if (err.message?.includes('already registered')) {
        toast.error('This email is already registered. Sign in instead.')
      } else {
        toast.error(err.message || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Show welcome screen after successful registration
  if (welcome) {
    return (
      <WelcomeScreen
        name={welcome}
        onContinue={() => navigate('/dashboard')}
      />
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-4 shadow-xl"
               style={{ background: 'linear-gradient(135deg, #1E40AF, #F59E0B)' }}>
            <span className="text-2xl font-black text-white">A</span>
          </div>
          <h1 className="text-3xl font-black text-white">{t('auth.register')}</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Start your journey to{' '}
            <span className="text-alex-amber font-semibold">Get The License</span>
          </p>
        </div>

        <div className="card space-y-5">

          {/* Full Name */}
          <div>
            <label className="label">{t('auth.fullName')}</label>
            <input
              className={`input ${errors.full_name ? 'border-alex-error' : ''}`}
              placeholder="John Martinez"
              value={form.full_name}
              onChange={set('full_name')}
              disabled={loading}
              autoFocus
            />
            {errors.full_name && <p className="text-alex-error text-xs mt-1">{errors.full_name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="label">{t('auth.email')}</label>
            <input
              type="email"
              className={`input ${errors.email ? 'border-alex-error' : ''}`}
              placeholder="you@email.com"
              value={form.email}
              onChange={set('email')}
              disabled={loading}
            />
            {errors.email && <p className="text-alex-error text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="label">{t('auth.password')}</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                className={`input pr-12 ${errors.password ? 'border-alex-error' : ''}`}
                placeholder="Create a strong password"
                value={form.password}
                onChange={set('password')}
                disabled={loading}
              />
              <button type="button" onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {form.password.length > 0 && (
              <div className="mt-2 space-y-1 pl-1">
                <PasswordRule met={rules.length} label="At least 8 characters" />
                <PasswordRule met={rules.upper}  label="One uppercase letter"  />
                <PasswordRule met={rules.number} label="One number"            />
              </div>
            )}
            {errors.password && <p className="text-alex-error text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="label">{t('auth.confirmPassword')}</label>
            <input
              type="password"
              className={`input ${errors.confirm ? 'border-alex-error' : ''}`}
              placeholder="Repeat your password"
              value={form.confirm}
              onChange={set('confirm')}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              disabled={loading}
            />
            {errors.confirm && <p className="text-alex-error text-xs mt-1">{errors.confirm}</p>}
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> Creating account...</>
              : t('auth.registerBtn')
            }
          </button>

          {/* What's included */}
          <div className="bg-navy-700 rounded-xl p-4 border border-navy-600">
            <div className="flex items-start gap-3">
              <span className="text-xl">🎯</span>
              <div>
                <p className="text-sm font-semibold text-white">Free Account Includes:</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Access to all 31 study modules · Official CSLB references · Bilingual EN/ES
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          {t('auth.hasAccount')}{' '}
          <Link to="/login"
            className="text-alex-amber hover:text-alex-amber-light font-semibold transition-colors">
            {t('auth.loginBtn')}
          </Link>
        </p>
      </div>
    </div>
  )
}

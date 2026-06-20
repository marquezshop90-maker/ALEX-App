import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const { t } = useTranslation()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from || '/dashboard'

  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm]         = useState({ email: '', password: '' })
  const [errors, setErrors]     = useState({})

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(er => ({ ...er, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.email.includes('@')) e.email    = 'Enter a valid email'
    if (!form.password)            e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      })
      if (error) throw error

      // Update last login
      await supabase
        .from('user_profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('user_id', data.user.id)

      toast.success('Welcome back!')
      navigate(from, { replace: true })

    } catch (err) {
      // Clear error messages — no redirects to email verification
      if (err.message?.includes('Invalid login credentials')) {
        toast.error('Incorrect email or password. Please try again.')
      } else if (err.message?.includes('Email not confirmed')) {
        // This means Supabase still has email confirmation ON
        // Show a helpful message instead of redirecting
        toast.error('Account pending confirmation. Please disable email confirmations in Supabase Auth settings.')
      } else {
        toast.error(err.message || 'Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-3xl font-black text-white">{t('auth.login')}</h1>
          <p className="text-gray-400 mt-2 text-sm">Continue your exam preparation</p>
        </div>

        <div className="card space-y-5">

          {/* Email */}
          <div>
            <label className="label">{t('auth.email')}</label>
            <input
              type="email"
              className={`input ${errors.email ? 'border-alex-error' : ''}`}
              placeholder="you@email.com"
              value={form.email}
              onChange={set('email')}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              disabled={loading}
              autoFocus
            />
            {errors.email && <p className="text-alex-error text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">{t('auth.password')}</label>
              <Link to="/forgot-password"
                className="text-xs text-alex-amber hover:text-alex-amber-light transition-colors">
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                className={`input pr-12 ${errors.password ? 'border-alex-error' : ''}`}
                placeholder="Your password"
                value={form.password}
                onChange={set('password')}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                disabled={loading}
              />
              <button type="button" onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-alex-error text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2">
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> Signing in...</>
              : t('auth.loginBtn')
            }
          </button>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          {t('auth.noAccount')}{' '}
          <Link to="/register"
            className="text-alex-amber hover:text-alex-amber-light font-semibold transition-colors">
            {t('auth.registerBtn')}
          </Link>
        </p>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { KeyRound, CheckCircle2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async () => {
    if (!email.includes('@')) {
      toast.error('Enter a valid email address.')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (error) throw error
      setSent(true)
    } catch (err) {
      toast.error('Could not send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md animate-bounce-in text-center">
          <div className="inline-flex w-20 h-20 rounded-3xl bg-alex-success/20 border border-alex-success/30
                          items-center justify-center mb-6">
            <CheckCircle2 size={36} className="text-alex-success" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3">Check your email</h1>
          <p className="text-gray-400 mb-6">
            We sent a password reset link to <span className="text-alex-amber font-bold">{email}</span>
          </p>
          <Link to="/login" className="btn-primary inline-block">
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-alex-blue/20 border border-alex-blue/30
                          items-center justify-center mb-4">
            <KeyRound size={28} className="text-blue-400" />
          </div>
          <h1 className="text-3xl font-black text-white">Reset Password</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <div className="card space-y-5">
          <div>
            <label className="label">Email Address</label>
            <input
              type="email"
              className="input"
              placeholder="you@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              disabled={loading}
              autoFocus
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> Sending...</>
              : 'Send Reset Link'
            }
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Remember your password?{' '}
          <Link to="/login" className="text-alex-amber hover:text-alex-amber-light font-semibold transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}

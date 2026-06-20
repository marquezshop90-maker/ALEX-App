import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Mail, RefreshCw, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function VerifyEmail() {
  const location = useLocation()
  const navigate = useNavigate()
  const email = location.state?.email || 'your email'
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const handleResend = async () => {
    setResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` }
      })
      if (error) throw error
      setResent(true)
      toast.success('Verification email resent!')
      setTimeout(() => setResent(false), 5000)
    } catch (err) {
      toast.error('Could not resend. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-slide-up text-center">

        {/* Icon */}
        <div className="inline-flex w-20 h-20 rounded-3xl bg-alex-blue/20 border border-alex-blue/30
                        items-center justify-center mb-6">
          <Mail size={36} className="text-blue-400" />
        </div>

        <h1 className="text-3xl font-black text-white mb-3">Check your inbox</h1>
        <p className="text-gray-400 mb-2">
          We sent a verification link to:
        </p>
        <p className="text-alex-amber font-bold text-lg mb-6">{email}</p>

        <div className="card text-left mb-6 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5">1️⃣</span>
            <p className="text-gray-300 text-sm">Open the email from <span className="text-white font-semibold">ALEX / Marquez Project Solutions</span></p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5">2️⃣</span>
            <p className="text-gray-300 text-sm">Click the <span className="text-white font-semibold">"Confirm your email"</span> button</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5">3️⃣</span>
            <p className="text-gray-300 text-sm">You'll be redirected to your <span className="text-alex-amber font-semibold">ALEX Dashboard</span></p>
          </div>
        </div>

        {/* Resend */}
        {resent ? (
          <div className="flex items-center justify-center gap-2 text-alex-success font-semibold">
            <CheckCircle2 size={18} />
            Email resent successfully!
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            Didn't receive it?{' '}
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-alex-amber hover:text-alex-amber-light font-semibold
                         transition-colors disabled:opacity-50 inline-flex items-center gap-1"
            >
              {resending && <RefreshCw size={12} className="animate-spin" />}
              Resend email
            </button>
          </p>
        )}

        <button
          onClick={() => navigate('/login')}
          className="btn-secondary mt-6 w-full"
        >
          Back to Sign In
        </button>
      </div>
    </div>
  )
}

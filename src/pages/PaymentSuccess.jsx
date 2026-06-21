import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { CheckCircle2, Star, ArrowRight } from 'lucide-react'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const { refreshProfile } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Refresh profile so premium status updates immediately
    const refresh = async () => {
      await new Promise(r => setTimeout(r, 2000)) // wait for webhook
      await refreshProfile()
      setLoading(false)
    }
    refresh()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900 p-4">
      <div className="max-w-md w-full text-center space-y-6 animate-fade-in">

        {/* Success icon */}
        <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
          <CheckCircle2 size={48} className="text-green-400" />
        </div>

        <div>
          <h1 className="text-3xl font-black text-white mb-2">
            Welcome to Premium! 🎉
          </h1>
          <p className="text-gray-400 leading-relaxed">
            Your payment was successful. You now have full access to all ALEX
            features for one year.
          </p>
        </div>

        {/* What's unlocked */}
        <div className="card text-left space-y-3">
          <p className="font-bold text-white text-sm mb-4">You now have access to:</p>
          {[
            '✅ Interactive flashcards for all 31 modules',
            '✅ Mini-exams with instant feedback',
            '✅ AI-powered study tips',
            '✅ Full simulation exams (timed)',
            '✅ Performance analytics & weak areas',
          ].map(item => (
            <p key={item} className="text-gray-300 text-sm">{item}</p>
          ))}
        </div>

        {/* Support message */}
        <div className="card border border-blue-500/20 bg-blue-500/5 text-left">
          <p className="text-gray-400 text-sm leading-relaxed">
            <span className="text-white font-bold">Thank you for supporting ALEX.</span>{' '}
            Your subscription helps us keep this app free for the community and
            continue building tools for Latino contractors in the US.
          </p>
          <p className="text-blue-400 text-sm font-medium mt-2">
            — Deybi Marquez, Founder · MPS LLC
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            Activating your account...
          </div>
        ) : (
          <Link to="/dashboard" className="btn-primary w-full flex items-center justify-center gap-2 py-4">
            <Star size={18} fill="currentColor" />
            Start Studying
            <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </div>
  )
}

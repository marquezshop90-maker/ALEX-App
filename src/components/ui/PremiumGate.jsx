import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Star } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export default function PremiumGate({ children }) {
  const { t } = useTranslation()
  const { isPremium } = useAuthStore()
  const navigate = useNavigate()

  // Premium active — render normally
  if (isPremium()) return children

  // Free user — show blurred preview + soft upgrade card
  return (
    <div className="space-y-4">
      {/* Blurred content preview */}
      <div className="pointer-events-none select-none blur-sm opacity-30 max-h-48 overflow-hidden">
        {children}
      </div>

      {/* Soft, non-aggressive upgrade card */}
      <div className="card border-alex-amber/20 bg-navy-800">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-alex-amber/10 flex items-center justify-center flex-shrink-0">
            <Star size={18} className="text-alex-amber" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white text-sm">{t('premium.locked')}</p>
            <p className="text-gray-400 text-xs mt-1 leading-relaxed">
              {t('premium.lockedDesc')}
            </p>
            <button
              onClick={() => navigate('/profile')}
              className="mt-3 text-alex-amber hover:text-alex-amber-light text-sm font-semibold
                         transition-colors underline underline-offset-2"
            >
              {t('plans.upgrade')} →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

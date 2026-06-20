import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

export default function LanguageToggle() {
  const { i18n } = useTranslation()
  const { user } = useAuthStore()
  const current = i18n.language

  const toggle = async () => {
    const next = current === 'EN' ? 'ES' : 'EN'
    i18n.changeLanguage(next)
    localStorage.setItem('alex_lang', next)
    if (user) {
      await supabase
        .from('user_profiles')
        .update({ preferred_language: next })
        .eq('user_id', user.id)
    }
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-navy-700 border border-navy-600
                 hover:border-alex-amber/40 transition-all duration-200 text-sm font-bold"
    >
      <span className={current === 'EN' ? 'text-alex-amber' : 'text-gray-500'}>EN</span>
      <span className="text-gray-600">/</span>
      <span className={current === 'ES' ? 'text-alex-amber' : 'text-gray-500'}>ES</span>
    </button>
  )
}

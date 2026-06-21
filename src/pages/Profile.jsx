import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { User, Star, CheckCircle2, Crown, Calendar, Mail, LogOut, ChevronRight, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

const PLANS = {
  free: {
    name: 'Free',
    nameEs: 'Gratis',
    color: 'text-gray-400',
    bg: 'bg-navy-700',
    border: 'border-navy-600',
    items: ['All 31 study modules', 'Official references', 'Bilingual EN/ES'],
    itemsEs: ['31 módulos de estudio', 'Referencias oficiales', 'Bilingüe EN/ES'],
  },
  premium: {
    name: 'Premium',
    nameEs: 'Premium',
    color: 'text-alex-amber',
    bg: 'bg-alex-amber/10',
    border: 'border-alex-amber/40',
    items: ['Everything in Free', 'Interactive flashcards', 'Mini-exams + AI tutor', 'Full simulation exams', 'Performance analytics'],
    itemsEs: ['Todo lo de Gratis', 'Flashcards interactivas', 'Mini-exámenes + IA', 'Exámenes simulados', 'Análisis de rendimiento'],
  },
}

export default function Profile() {
  const { t, i18n }                              = useTranslation()
  const { user, profile, signOut, refreshProfile } = useAuthStore()
  const navigate                                  = useNavigate()
  const isEs = i18n.language === 'ES'

  const [subscription, setSubscription] = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [editName,     setEditName]     = useState(false)
  const [newName,      setNewName]      = useState(profile?.full_name || '')
  const [savingName,   setSavingName]   = useState(false)

  // Password change state
  const [showPwForm, setShowPwForm] = useState(false)
  const [newPw,      setNewPw]      = useState('')
  const [confirmPw,  setConfirmPw]  = useState('')
  const [changingPw, setChangingPw] = useState(false)

  const isPrem  = profile?.subscription_type === 'premium' && profile?.subscription_status === 'active'
  const isTrial = profile?.subscription_status === 'trialing'
  const isAdmin = profile?.role === 'super_admin'
  const planKey = (isPrem || isTrial || isAdmin) ? 'premium' : 'free'
  const plan    = PLANS[planKey]

  useEffect(() => {
    const load = async () => {
      if (!user) return
      try {
        const { data } = await supabase
          .from('subscriptions').select('*').eq('user_id', user.id).maybeSingle()
        setSubscription(data)
      } catch (err) {
        console.error('Profile load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const saveName = async () => {
    if (!newName.trim()) return
    setSavingName(true)
    try {
      await supabase.from('user_profiles')
        .update({ full_name: newName.trim() })
        .eq('user_id', user.id)
      await refreshProfile()
      setEditName(false)
      toast.success(isEs ? '¡Nombre actualizado!' : 'Name updated!')
    } catch {
      toast.error(isEs ? 'Error al guardar.' : 'Could not save.')
    } finally {
      setSavingName(false)
    }
  }

  const changePassword = async () => {
    if (!newPw || newPw.length < 6) {
      toast.error(isEs ? 'Mínimo 6 caracteres' : 'Minimum 6 characters')
      return
    }
    if (newPw !== confirmPw) {
      toast.error(isEs ? 'Las contraseñas no coinciden' : 'Passwords do not match')
      return
    }
    setChangingPw(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) {
      toast.error(isEs ? 'Error al cambiar contraseña' : 'Error changing password')
    } else {
      toast.success(isEs ? '¡Contraseña actualizada!' : 'Password updated!')
      setShowPwForm(false)
      setNewPw('')
      setConfirmPw('')
    }
    setChangingPw(false)
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/login'
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-alex-amber border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <h1 className="text-3xl font-black text-white">
        {isEs ? 'Mi Perfil' : 'My Profile'}
      </h1>

      {/* User info card */}
      <div className="card">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0"
               style={{ background: 'linear-gradient(135deg, #1E40AF, #F59E0B)' }}>
            {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            {editName ? (
              <div className="flex items-center gap-2">
                <input value={newName} onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveName()}
                  className="input py-2 text-sm flex-1" autoFocus />
                <button onClick={saveName} disabled={savingName} className="btn-primary py-2 px-3 text-xs">
                  {savingName ? '...' : (isEs ? 'Guardar' : 'Save')}
                </button>
                <button onClick={() => setEditName(false)} className="btn-secondary py-2 px-3 text-xs">
                  {isEs ? 'Cancelar' : 'Cancel'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-black text-white text-lg truncate">{profile?.full_name}</p>
                <button onClick={() => { setNewName(profile?.full_name || ''); setEditName(true) }}
                  className="text-gray-600 hover:text-alex-amber transition-colors text-xs">
                  ✏️
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Mail size={13} className="text-gray-500" />
              <p className="text-gray-400 text-sm truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <span className="badge-admin flex items-center gap-1">
              <Crown size={10} /> Super Admin
            </span>
          )}
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${plan.border} ${plan.bg} ${plan.color}`}>
            {isEs ? plan.nameEs : plan.name}
            {isTrial && !isAdmin && <span className="ml-1 opacity-70">· Active</span>}
          </span>
        </div>
      </div>

      {/* Current plan */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Star size={18} className="text-alex-amber" />
          <h2 className="font-bold text-white">{isEs ? 'Plan Actual' : 'Current Plan'}</h2>
        </div>

        <div className={`rounded-xl p-4 border mb-4 ${plan.border} ${plan.bg}`}>
          <div className="flex items-center justify-between mb-3">
            <p className={`font-black text-lg ${plan.color}`}>{isEs ? plan.nameEs : plan.name}</p>
            {(isPrem || isAdmin) && (
              <span className="text-xs text-alex-success font-bold">● Active</span>
            )}
          </div>
          <ul className="space-y-2">
            {(isEs ? plan.itemsEs : plan.items).map(item => (
              <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle2 size={14} className="text-alex-success flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Upgrade CTA — only for free users */}
        {!isPrem && !isAdmin && planKey === 'free' && (
          <div className="rounded-xl p-4 border border-alex-amber/30 bg-alex-amber/5">
            <p className="font-bold text-white mb-1">
              {isEs ? 'Actualizar a Premium' : 'Upgrade to Premium'}
            </p>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">
              {isEs
                ? 'Desbloquea flashcards, mini-exámenes, tutoría con IA y exámenes simulados completos.'
                : 'Unlock flashcards, mini-exams, AI tutoring, and full simulation exams.'}
            </p>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl font-black text-alex-amber">$29.00</span>
              <span className="text-gray-400 text-sm">{isEs ? '/mes' : '/month'}</span>
            </div>
            <button
              onClick={() => navigate('/upgrade')}
              className="btn-primary w-full flex items-center justify-center gap-2">
              <Star size={16} fill="currentColor" />
              {isEs ? 'Ver Plan Premium' : 'See Premium Plan'}
            </button>
            <p className="text-gray-600 text-xs text-center mt-2">
              {isEs ? 'Cancela cuando quieras' : 'Cancel anytime'}
            </p>
          </div>
        )}

        {/* Subscription details for premium */}
        {subscription?.current_period_end && isPrem && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
            <Calendar size={14} />
            {isEs ? 'Próximo cargo:' : 'Next billing:'}{' '}
            {new Date(subscription.current_period_end).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Account actions */}
      <div className="card space-y-1">
        <h2 className="font-bold text-white mb-3">{isEs ? 'Cuenta' : 'Account'}</h2>

        {/* Change Password */}
        <button
          onClick={() => { setShowPwForm(!showPwForm); setNewPw(''); setConfirmPw('') }}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-300
                     hover:bg-navy-700 transition-all duration-200 text-sm">
          <Lock size={16} className="text-gray-500" />
          {isEs ? 'Cambiar contraseña' : 'Change Password'}
          <ChevronRight size={14} className={`ml-auto text-gray-600 transition-transform duration-200 ${showPwForm ? 'rotate-90' : ''}`} />
        </button>

        {showPwForm && (
          <div className="mx-3 mb-2 p-4 rounded-xl bg-navy-700/50 border border-navy-600 space-y-3">
            <input
              type="password"
              placeholder={isEs ? 'Nueva contraseña' : 'New password'}
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              className="input w-full text-sm"
              autoFocus
            />
            <input
              type="password"
              placeholder={isEs ? 'Confirmar contraseña' : 'Confirm password'}
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && changePassword()}
              className="input w-full text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={changePassword}
                disabled={changingPw || !newPw || !confirmPw}
                className="btn-primary flex-1 py-2 text-sm disabled:opacity-50">
                {changingPw ? '...' : (isEs ? 'Guardar contraseña' : 'Save Password')}
              </button>
              <button
                onClick={() => { setShowPwForm(false); setNewPw(''); setConfirmPw('') }}
                className="btn-secondary px-4 py-2 text-sm">
                {isEs ? 'Cancelar' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl
                     text-alex-error hover:bg-red-500/10 transition-all duration-200 text-sm">
          <LogOut size={16} />
          {isEs ? 'Cerrar Sesión' : 'Sign Out'}
        </button>
      </div>

      {/* Footer */}
      <p className="text-center text-gray-600 text-xs pb-4">
        ALEX by Marquez Project Solutions LLC · Sacramento, CA
      </p>
    </div>
  )
}

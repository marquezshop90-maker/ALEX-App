import { create } from 'zustand'
import { supabase, getUserProfile } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user:        null,
  profile:     null,
  loading:     true,
  initialized: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const profile = await getUserProfile(session.user.id)

        // If profile exists and is trialing, check expiry silently
        if (profile?.subscription_status === 'trialing') {
          await get()._checkTrial(session.user.id, profile)
          const fresh = await getUserProfile(session.user.id)
          set({ user: session.user, profile: fresh, loading: false, initialized: true })
        } else {
          set({ user: session.user, profile, loading: false, initialized: true })
        }
      } else {
        set({ user: null, profile: null, loading: false, initialized: true })
      }
    } catch (err) {
      console.error('Auth init error:', err)
      set({ user: null, profile: null, loading: false, initialized: true })
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const profile = await getUserProfile(session.user.id)

          if (profile?.subscription_status === 'trialing') {
            await get()._checkTrial(session.user.id, profile)
            const fresh = await getUserProfile(session.user.id)
            set({ user: session.user, profile: fresh })
          } else {
            set({ user: session.user, profile })
          }
        } catch (err) {
          console.error('Auth state change error:', err)
          set({ user: session.user, profile: null })
        }
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, profile: null })
      }
    })
  },

  // Silently downgrade expired trials — user never sees this happen
  _checkTrial: async (userId, profile) => {
    if (!profile?.trial_ends_at) return
    if (new Date(profile.trial_ends_at) < new Date()) {
      try {
        await supabase.rpc('check_and_downgrade_trial', { p_user_id: userId })
      } catch (err) {
        console.error('Trial check error:', err)
      }
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },

  refreshProfile: async () => {
    const { user } = get()
    if (!user) return
    try {
      const profile = await getUserProfile(user.id)
      set({ profile })
    } catch (err) {
      console.error('Refresh profile error:', err)
    }
  },

  // Premium check: admin always premium, active premium, or valid trial
  isPremium: () => {
    const { profile } = get()
    if (!profile) return false
    if (profile.role === 'super_admin') return true
    if (profile.subscription_type === 'premium') {
      if (profile.subscription_status === 'active') return true
      if (profile.subscription_status === 'trialing') {
        if (!profile.trial_ends_at) return true
        return new Date(profile.trial_ends_at) > new Date()
      }
    }
    return false
  },

  isSuperAdmin:    () => get().profile?.role === 'super_admin',
  isAuthenticated: () => !!get().user,
}))

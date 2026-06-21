import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Search, Crown, UserX, UserCheck,
  ChevronUp, ChevronDown, RefreshCw, Filter
} from 'lucide-react'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [actionLoading, setActionLoading] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => { fetchUsers() }, [])

  useEffect(() => {
    let result = [...users]
    // Filter by plan
    if (planFilter !== 'all') {
      result = result.filter(u => u.subscription_type === planFilter)
    }
    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(u =>
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      )
    }
    // Sort
    result.sort((a, b) => {
      let va = a[sortField] || ''
      let vb = b[sortField] || ''
      if (sortDir === 'asc') return va > vb ? 1 : -1
      return va < vb ? 1 : -1
    })
    setFiltered(result)
  }, [users, search, planFilter, sortField, sortDir])

  async function fetchUsers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        id, full_name, email, subscription_type,
        trial_ends_at, created_at, lang, role
      `)
      .order('created_at', { ascending: false })

    if (!error) setUsers(data || [])
    setLoading(false)
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function upgradeToPremium(userId) {
    setActionLoading(userId + '_upgrade')
    const trialEnd = new Date()
    trialEnd.setFullYear(trialEnd.getFullYear() + 1)
    const { error } = await supabase
      .from('user_profiles')
      .update({
        subscription_type: 'premium',
        trial_ends_at: trialEnd.toISOString()
      })
      .eq('id', userId)
    if (!error) {
      showToast('User upgraded to Premium ✓')
      fetchUsers()
    } else {
      showToast('Error upgrading user', 'error')
    }
    setActionLoading(null)
  }

  async function downgradeToFree(userId) {
    setActionLoading(userId + '_downgrade')
    const { error } = await supabase
      .from('user_profiles')
      .update({ subscription_type: 'free', trial_ends_at: null })
      .eq('id', userId)
    if (!error) {
      showToast('User downgraded to Free')
      fetchUsers()
    } else {
      showToast('Error downgrading user', 'error')
    }
    setActionLoading(null)
  }

  function toggleSort(field) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  function SortIcon({ field }) {
    if (sortField !== field) return <ChevronUp size={12} className="text-gray-600" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-alex-amber" />
      : <ChevronDown size={12} className="text-alex-amber" />
  }

  function formatDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  function getTrialStatus(user) {
    if (user.subscription_type === 'premium') {
      if (user.trial_ends_at) {
        const daysLeft = Math.ceil(
          (new Date(user.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24)
        )
        if (daysLeft > 0 && daysLeft <= 365)
          return { label: `Trial (${daysLeft}d left)`, color: 'text-blue-400 bg-blue-400/10' }
      }
      return { label: 'Premium', color: 'text-amber-400 bg-amber-400/10' }
    }
    return { label: 'Free', color: 'text-gray-400 bg-gray-700' }
  }

  const premiumCount = users.filter(u => u.subscription_type === 'premium').length
  const freeCount = users.filter(u => u.subscription_type !== 'premium').length

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl text-sm font-medium transition-all ${
          toast.type === 'error'
            ? 'bg-red-500/20 border border-red-500/30 text-red-400'
            : 'bg-green-500/20 border border-green-500/30 text-green-400'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-gray-400 text-sm mt-1">
            {users.length} total · {premiumCount} premium · {freeCount} free
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-navy-700 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9 w-full text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-500" />
          <select
            value={planFilter}
            onChange={e => setPlanFilter(e.target.value)}
            className="input text-sm pr-8"
          >
            <option value="all">All Plans</option>
            <option value="premium">Premium</option>
            <option value="free">Free</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading users...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No users found</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-700">
                  <th
                    className="text-left px-4 py-3 text-gray-400 font-medium cursor-pointer hover:text-white"
                    onClick={() => toggleSort('full_name')}
                  >
                    <div className="flex items-center gap-1">
                      Name <SortIcon field="full_name" />
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium hidden md:table-cell">
                    Email
                  </th>
                  <th
                    className="text-left px-4 py-3 text-gray-400 font-medium cursor-pointer hover:text-white"
                    onClick={() => toggleSort('subscription_type')}
                  >
                    <div className="flex items-center gap-1">
                      Plan <SortIcon field="subscription_type" />
                    </div>
                  </th>
                  <th
                    className="text-left px-4 py-3 text-gray-400 font-medium cursor-pointer hover:text-white hidden lg:table-cell"
                    onClick={() => toggleSort('created_at')}
                  >
                    <div className="flex items-center gap-1">
                      Joined <SortIcon field="created_at" />
                    </div>
                  </th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, i) => {
                  const status = getTrialStatus(user)
                  const isPremium = user.subscription_type === 'premium'
                  return (
                    <tr
                      key={user.id}
                      className={`border-b border-navy-700/50 hover:bg-navy-700/30 transition-colors ${
                        i % 2 === 0 ? '' : 'bg-navy-900/20'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-navy-700 flex items-center justify-center text-xs font-bold text-gray-300 shrink-0">
                            {(user.full_name || user.email || '?')[0].toUpperCase()}
                          </div>
                          <span className="text-white font-medium truncate max-w-[120px]">
                            {user.full_name || '—'}
                          </span>
                          {user.role === 'super_admin' && (
                            <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full">
                              Admin
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 hidden md:table-cell truncate max-w-[200px]">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {isPremium ? (
                            <button
                              onClick={() => downgradeToFree(user.id)}
                              disabled={!!actionLoading || user.role === 'super_admin'}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {actionLoading === user.id + '_downgrade' ? (
                                <RefreshCw size={12} className="animate-spin" />
                              ) : (
                                <UserX size={12} />
                              )}
                              Downgrade
                            </button>
                          ) : (
                            <button
                              onClick={() => upgradeToPremium(user.id)}
                              disabled={!!actionLoading}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {actionLoading === user.id + '_upgrade' ? (
                                <RefreshCw size={12} className="animate-spin" />
                              ) : (
                                <Crown size={12} />
                              )}
                              Upgrade
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-navy-700 text-xs text-gray-500">
            Showing {filtered.length} of {users.length} users
          </div>
        </div>
      )}
    </div>
  )
}

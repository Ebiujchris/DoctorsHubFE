import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { getCurrentUser, getAuthToken, logout } from '../services/auth'
import { fetchNotifications, markAllNotificationsRead } from '../services/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// ── helpers ────────────────────────────────────────────────────────────────────
const PROVIDER_ROLES = ['doctor', 'nurse', 'psychiatrist', 'carer']

const ROLE_META = {
  doctor:       { icon: '🩺', color: 'from-blue-600 to-indigo-600',   title: 'Dr.' },
  nurse:        { icon: '💉', color: 'from-teal-500 to-cyan-600',     title: '' },
  psychiatrist: { icon: '🧠', color: 'from-purple-600 to-violet-600', title: 'Dr.' },
  carer:        { icon: '🏠', color: 'from-orange-500 to-amber-500',  title: '' },
}

const STATUS = {
  pending:   { label: 'Pending',   cls: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-400', border: 'border-l-yellow-400' },
  confirmed: { label: 'Confirmed', cls: 'bg-green-100 text-green-800',   dot: 'bg-green-500',  border: 'border-l-green-500'  },
  rejected:  { label: 'Rejected',  cls: 'bg-red-100 text-red-800',       dot: 'bg-red-500',    border: 'border-l-red-400'    },
  cancelled: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-600',   dot: 'bg-slate-400',  border: 'border-l-slate-300'  },
}

const typeColor = {
  booking_created:   'border-l-indigo-400 bg-indigo-50',
  booking_confirmed: 'border-l-green-400 bg-green-50',
  booking_rejected:  'border-l-red-400 bg-red-50',
  booking_cancelled: 'border-l-yellow-400 bg-yellow-50',
  general:           'border-l-blue-400 bg-blue-50',
}

function Badge({ status }) {
  const s = STATUS[status] || STATUS.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

function timeAgo(d) {
  const mins = Math.floor((Date.now() - new Date(d)) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const NAV = [
  { id: 'overview',      icon: '🏠', label: 'Overview'      },
  { id: 'requests',      icon: '📋', label: 'Requests'      },
  { id: 'schedule',      icon: '📅', label: 'My Schedule'   },
  { id: 'patients',      icon: '👥', label: 'Patients'      },
  { id: 'notifications', icon: '🔔', label: 'Notifications' },
  { id: 'profile',       icon: '👤', label: 'Profile'       },
]
// Main Provider Dashboard Component
export default function ProviderDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }

    // Check if user is a provider
    if (!PROVIDER_ROLES.includes(currentUser.role)) {
      router.push('/dashboard') // Redirect to patient dashboard
      return
    }

    setUser(currentUser)
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const roleMeta = ROLE_META[user.role] || ROLE_META.doctor

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${roleMeta.color} flex items-center justify-center text-white text-xl`}>
                {roleMeta.icon}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                  {getGreeting()}, {roleMeta.title} {user.firstName}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                  {user.role} Dashboard
                </p>
              </div>
            </div>
            
            <button
              onClick={() => {
                logout()
                router.push('/')
              }}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {NAV.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === item.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">{roleMeta.icon}</div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              Provider Dashboard
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Welcome to your {user.role} dashboard. This feature is under development.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg">
              <span>🚧</span>
              <span className="text-sm font-medium">Coming Soon</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import { getCurrentUser, getAuthToken } from '../services/auth'
import { fetchFeaturedDoctors_Combined, fetchNotifications, markAllNotificationsRead } from '../services/api'

// Map notification type to a left-border colour
const typeColor = {
  booking_created: 'border-indigo-500 bg-indigo-50',
  booking_confirmed: 'border-green-500 bg-green-50',
  booking_rejected: 'border-red-500 bg-red-50',
  booking_cancelled: 'border-yellow-500 bg-yellow-50',
  general: 'border-blue-500 bg-blue-50',
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [providers, setProviders] = useState([])
  const [loadingProviders, setLoadingProviders] = useState(false)
  const [providersError, setProvidersError] = useState('')

  const loadNotifications = useCallback(async () => {
    const token = getAuthToken()
    if (!token) return
    try {
      const data = await fetchNotifications(token)
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.read).length)
    } catch (_) {}
  }, [])

  useEffect(() => {
    const u = getCurrentUser()
    if (!u) { router.replace('/login'); return }
    setUser(u)
    loadNotifications()

    // Poll every 30 seconds for new notifications
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [router, loadNotifications])

  useEffect(() => {
    if (!user || user.role !== 'patient') return
    const fetchProviders = async () => {
      try {
        setLoadingProviders(true)
        setProviders(await fetchFeaturedDoctors_Combined())
      } catch (_) {
        setProvidersError('Unable to load healthcare providers')
      } finally {
        setLoadingProviders(false)
      }
    }
    fetchProviders()
  }, [user])

  const handleOpenNotifications = async () => {
    setShowNotifications(true)
    if (unreadCount > 0) {
      const token = getAuthToken()
      if (token) {
        await markAllNotificationsRead(token)
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    }
  }

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="max-w-5xl mx-auto p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-600 mt-1">Welcome to your DoctorsHub account</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* welcome card */}
          <div className="bg-white rounded-lg shadow p-6">
            {user.role === 'patient' ? (
              <>
                <h2 className="text-xl font-semibold text-indigo-700 mb-2">Hello, {user.firstName}</h2>
                <p className="text-slate-600">Here's a quick overview of your activity.</p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-indigo-700 mb-2">Dr. {user.lastName}</h2>
                <p className="text-slate-600">Manage your patients and schedule below.</p>
              </>
            )}
          </div>

          {/* appointments card */}
          <button
            onClick={() => router.push(user.role === 'patient' ? '/appointments' : '/provider-appointments')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            {user.role === 'patient' ? (
              <>
                <h3 className="font-medium text-slate-700 mb-2">📅 My Appointments</h3>
                <p className="text-slate-600 text-sm">View and track your bookings</p>
              </>
            ) : (
              <>
                <h3 className="font-medium text-slate-700 mb-2">📋 Appointment Requests</h3>
                <p className="text-slate-600 text-sm">Approve or reject patient requests</p>
              </>
            )}
          </button>

          {/* notifications card */}
          <div
            onClick={handleOpenNotifications}
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Notifications</h2>
                <p className="text-slate-600 text-sm mt-1">Click to view</p>
              </div>
              {unreadCount > 0 && (
                <div className="bg-red-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
              {unreadCount === 0 && (
                <div className="text-slate-400 text-3xl">🔔</div>
              )}
            </div>
          </div>
        </div>

        {/* notifications modal */}
        {showNotifications && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">🔔 Notifications</h2>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-white hover:bg-indigo-700 w-8 h-8 flex items-center justify-center rounded transition"
                >
                  ✕
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-6 space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No notifications yet.</p>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`border-l-4 pl-4 py-3 rounded ${typeColor[n.type] || typeColor.general} ${n.read ? 'opacity-70' : ''}`}
                    >
                      <p className="text-sm font-medium text-slate-800">{n.message}</p>
                      <p className="text-xs text-slate-500 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="bg-slate-50 px-6 py-4 border-t flex justify-end">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-800 rounded hover:bg-slate-300 transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Healthcare Providers Section - Patients Only */}
        {user.role === 'patient' && (
          <section className="mt-12">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">Healthcare Providers</h2>
              <p className="text-slate-600">Find and book appointments with our verified healthcare professionals</p>
            </div>

            {providersError && (
              <div className="bg-red-50 border border-red-200 px-6 py-4 rounded-lg mb-6">
                <p className="text-red-800 font-medium">{providersError}</p>
              </div>
            )}

            {loadingProviders ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
                    <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto mb-4"></div>
                    <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2 mx-auto mb-4"></div>
                  </div>
                ))}
              </div>
            ) : providers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {providers.map(provider => (
                  <div key={provider.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
                    <div className="relative h-48 bg-gradient-to-br from-indigo-100 to-blue-100 overflow-hidden">
                      <img
                        src={provider.image}
                        alt={provider.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3 bg-white rounded-full px-3 py-1 flex items-center gap-1 shadow-md">
                        <span className="text-yellow-400">⭐</span>
                        <span className="text-sm font-semibold text-slate-700">{provider.rating}</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-slate-800 mb-1">{provider.name}</h3>
                      <p className="text-indigo-600 font-medium text-sm mb-3">{provider.specialty}</p>
                      <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-slate-200 text-xs">
                        <div>
                          <p className="text-slate-500 font-medium">Experience</p>
                          <p className="text-slate-700 font-semibold text-sm">{provider.experience}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-medium">Response</p>
                          <p className="text-slate-700 font-semibold text-sm">{provider.responseTime}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mb-4">
                        <span className="font-semibold text-slate-700">{provider.reviews}</span> patient reviews
                      </p>
                      <button
                        onClick={() => {
                          localStorage.setItem('selectedProvider', JSON.stringify(provider))
                          router.push(`/book-appointment/${provider.id}`)
                        }}
                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold py-2.5 rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
                      >
                        Book Appointment
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-12 text-center">
                <p className="text-slate-600 text-lg mb-4">No healthcare providers available at the moment</p>
                <p className="text-slate-500">Check back soon for new providers</p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

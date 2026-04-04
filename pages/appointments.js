import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import { getCurrentUser, getAuthToken } from '../services/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳', label: 'Pending' },
    confirmed: { bg: 'bg-green-100', text: 'text-green-800', icon: '✅', label: 'Confirmed' },
    rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: '❌', label: 'Rejected' },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', icon: '🚫', label: 'Cancelled' }
  }
  const config = statusConfig[status] || statusConfig.pending
  
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  )
}

export default function Appointments() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all, pending, confirmed, rejected

  useEffect(() => {
    const u = getCurrentUser()
    if (!u) {
      router.push('/login')
      return
    }
    setUser(u)

    // Only patients can view appointments
    if (u.role !== 'patient') {
      router.push('/dashboard')
      return
    }

    fetchAppointments()
  }, [router])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/bookings`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch appointments')
      }

      const data = await response.json()
      setAppointments(data)
      setError('')
    } catch (err) {
      console.error(err)
      setError('Unable to load appointments')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredAppointments = () => {
    if (filter === 'all') return appointments
    return appointments.filter(apt => apt.status === filter)
  }

  const filteredAppointments = getFilteredAppointments()

  const getStatusColor = (status) => {
    const colors = {
      pending: 'from-yellow-500 to-orange-500',
      confirmed: 'from-green-500 to-emerald-500',
      rejected: 'from-red-500 to-rose-500',
      cancelled: 'from-gray-500 to-gray-600'
    }
    return colors[status] || colors.pending
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-indigo-600 hover:text-indigo-700 font-medium mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">My Appointments</h1>
          <p className="text-slate-600">Track your bookings and consultation status</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm mb-1">Total Bookings</p>
            <p className="text-3xl font-bold text-slate-800">{appointments.length}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-6 border border-yellow-200">
            <p className="text-yellow-800 text-sm mb-1">⏳ Pending</p>
            <p className="text-3xl font-bold text-yellow-700">{appointments.filter(a => a.status === 'pending').length}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
            <p className="text-green-800 text-sm mb-1">✅ Confirmed</p>
            <p className="text-3xl font-bold text-green-700">{appointments.filter(a => a.status === 'confirmed').length}</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-6 border border-red-200">
            <p className="text-red-800 text-sm mb-1">❌ Rejected</p>
            <p className="text-3xl font-bold text-red-700">{appointments.filter(a => a.status === 'rejected').length}</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'pending', 'confirmed', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === f
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-300 hover:border-indigo-600'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 px-6 py-4 rounded-lg mb-6">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Appointments List */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredAppointments.length > 0 ? (
          <div className="grid gap-5">
            {filteredAppointments.map(appointment => (
              <div key={appointment.id} className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden border-l-4 border-l-indigo-600`}>
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">
                        {appointment.provider.firstName} {appointment.provider.lastName}
                      </h3>
                      <p className="text-indigo-600 font-semibold mb-3">
                        {appointment.provider.specialty || appointment.provider.role}
                      </p>
                      
                      {/* Appointment Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-slate-700">
                          <span className="text-lg">📅</span>
                          <div>
                            <p className="text-xs text-slate-500">Date</p>
                            <p className="font-semibold">
                              {new Date(appointment.startTime).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-slate-700">
                          <span className="text-lg">🕐</span>
                          <div>
                            <p className="text-xs text-slate-500">Time</p>
                            <p className="font-semibold">
                              {new Date(appointment.startTime).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-slate-700">
                          <span className="text-lg">
                            {appointment.consultationType === 'video' ? '📹' : '👨‍⚕️'}
                          </span>
                          <div>
                            <p className="text-xs text-slate-500">Type</p>
                            <p className="font-semibold">
                              {appointment.consultationType === 'video' ? 'Video Consultation' : 'Physical Visit'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-lg">📊</span>
                          <div>
                            <p className="text-xs text-slate-500">Status</p>
                            <StatusBadge status={appointment.status} />
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {appointment.notes && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-xs font-semibold text-slate-600 mb-2">📝 Your Notes:</p>
                          <p className="text-slate-700">{appointment.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {appointment.status === 'confirmed' && appointment.consultationType === 'video' && appointment.meetingLink && (
                        <a
                          href={appointment.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg text-center"
                        >
                          📹 Join Meeting
                        </a>
                      )}
                      
                      {appointment.status === 'pending' && (
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                          <p className="text-sm text-yellow-800 font-medium">Waiting for approval...</p>
                        </div>
                      )}

                      {appointment.status === 'rejected' && (
                        <button
                          onClick={() => router.push(`/dashboard`)}
                          className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition text-center text-sm"
                        >
                          Try Another Provider
                        </button>
                      )}

                      {appointment.status === 'confirmed' && appointment.consultationType === 'physical' && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-800 font-medium">Please arrive on time</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Meeting Link Display */}
                  {appointment.status === 'confirmed' && appointment.consultationType === 'video' && appointment.meetingLink && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mt-4">
                      <p className="text-xs font-semibold text-indigo-700 mb-2">📹 Video Meeting Link:</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm text-indigo-600 break-all">{appointment.meetingLink}</code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(appointment.meetingLink)
                            alert('Link copied!')
                          }}
                          className="px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded hover:bg-indigo-700 transition"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-xl p-12 text-center border border-slate-200">
            <p className="text-slate-600 text-lg mb-4">📭 No appointments yet</p>
            <p className="text-slate-500 mb-6">You haven't booked any appointments. Browse healthcare providers and book your first appointment!</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
            >
              Browse Providers
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

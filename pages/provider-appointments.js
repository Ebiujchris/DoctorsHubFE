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

export default function ProviderAppointments() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('pending') // pending, confirmed, rejected, all
  const [actionLoading, setActionLoading] = useState({})
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const u = getCurrentUser()
    if (!u) {
      router.push('/login')
      return
    }
    setUser(u)

    // Only healthcare providers can view this
    if (['doctor', 'nurse', 'psychiatrist', 'carer'].indexOf(u.role) === -1) {
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

  const handleApprove = async (appointmentId) => {
    setActionLoading(prev => ({ ...prev, [appointmentId]: 'approving' }))
    try {
      const response = await fetch(`${API_BASE}/bookings/${appointmentId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to approve appointment')
      }

      // Update appointment in list
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId ? { ...apt, status: 'confirmed' } : apt
        )
      )
      setSuccessMessage('✅ Appointment approved!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      console.error(err)
      alert('Failed to approve: ' + err.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [appointmentId]: null }))
    }
  }

  const handleReject = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to reject this appointment?')) return

    setActionLoading(prev => ({ ...prev, [appointmentId]: 'rejecting' }))
    try {
      const response = await fetch(`${API_BASE}/bookings/${appointmentId}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to reject appointment')
      }

      // Update appointment in list
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId ? { ...apt, status: 'rejected' } : apt
        )
      )
      setSuccessMessage('❌ Appointment rejected!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      console.error(err)
      alert('Failed to reject: ' + err.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [appointmentId]: null }))
    }
  }

  const getFilteredAppointments = () => {
    if (filter === 'all') return appointments
    return appointments.filter(apt => apt.status === filter)
  }

  const filteredAppointments = getFilteredAppointments()

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
            onClick={() => router.push('/dashboard')}
            className="text-indigo-600 hover:text-indigo-700 font-medium mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Appointment Requests</h1>
          <p className="text-slate-600">Manage and approve patient booking requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm mb-1">Total Requests</p>
            <p className="text-3xl font-bold text-slate-800">{appointments.length}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-6 border border-yellow-200">
            <p className="text-yellow-800 text-sm mb-1">⏳ Pending</p>
            <p className="text-3xl font-bold text-yellow-700">{appointments.filter(a => a.status === 'pending').length}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
            <p className="text-green-800 text-sm mb-1">✅ Approved</p>
            <p className="text-3xl font-bold text-green-700">{appointments.filter(a => a.status === 'confirmed').length}</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-6 border border-red-200">
            <p className="text-red-800 text-sm mb-1">❌ Rejected</p>
            <p className="text-3xl font-bold text-red-700">{appointments.filter(a => a.status === 'rejected').length}</p>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 px-6 py-4 rounded-lg mb-6 text-green-800 font-medium">
            {successMessage}
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['pending', 'confirmed', 'rejected', 'all'].map(f => (
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
              <div 
                key={appointment.id} 
                className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden border-l-4 ${
                  appointment.status === 'pending' ? 'border-l-yellow-500' :
                  appointment.status === 'confirmed' ? 'border-l-green-500' :
                  'border-l-red-500'
                }`}
              >
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Patient Info */}
                    <div className="lg:col-span-1">
                      <h3 className="text-xl font-bold text-slate-800 mb-1">
                        {appointment.patient.firstName} {appointment.patient.lastName}
                      </h3>
                      <p className="text-slate-600 mb-4">Patient</p>
                      
                      {/* Patient Contact */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-700">
                          <span>📧</span>
                          <a href={`mailto:${appointment.patient.email}`} className="text-indigo-600 hover:underline">
                            {appointment.patient.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                          <span>📱</span>
                          <a href={`tel:${appointment.patient.phone}`} className="text-indigo-600 hover:underline">
                            {appointment.patient.phone}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="lg:col-span-1">
                      <h4 className="text-sm font-semibold text-slate-600 mb-3 uppercase">Appointment Details</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-slate-500">Date</p>
                          <p className="font-semibold text-slate-800">
                            {new Date(appointment.startTime).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-slate-500">Time</p>
                          <p className="font-semibold text-slate-800">
                            {new Date(appointment.startTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">Type</p>
                          <p className="font-semibold text-slate-800">
                            {appointment.consultationType === 'video' ? '📹 Video' : '👨‍⚕️ Physical'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">Status</p>
                          <StatusBadge status={appointment.status} />
                        </div>
                      </div>
                    </div>

                    {/* Notes & Actions */}
                    <div className="lg:col-span-1">
                      {/* Patient Notes */}
                      {appointment.notes && (
                        <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-xs font-semibold text-slate-600 mb-2">📝 Patient Notes:</p>
                          <p className="text-slate-700 text-sm">{appointment.notes}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {appointment.status === 'pending' && (
                        <div className="space-y-2">
                          <button
                            onClick={() => handleApprove(appointment.id)}
                            disabled={actionLoading[appointment.id] === 'approving'}
                            className="w-full px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
                          >
                            {actionLoading[appointment.id] === 'approving' ? '⏳ Approving...' : '✅ Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(appointment.id)}
                            disabled={actionLoading[appointment.id] === 'rejecting'}
                            className="w-full px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-rose-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
                          >
                            {actionLoading[appointment.id] === 'rejecting' ? '⏳ Rejecting...' : '❌ Reject'}
                          </button>
                        </div>
                      )}

                      {appointment.status === 'confirmed' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-green-800 font-medium text-sm mb-2">✅ Appointment Approved</p>
                          {appointment.consultationType === 'video' && appointment.meetingLink && (
                            <div className="text-xs">
                              <p className="text-green-700 font-semibold mb-1">Meeting Link:</p>
                              <a 
                                href={appointment.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 break-all hover:underline"
                              >
                                {appointment.meetingLink}
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {appointment.status === 'rejected' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <p className="text-red-800 font-medium text-sm">❌ Appointment Rejected</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-xl p-12 text-center border border-slate-200">
            <p className="text-slate-600 text-lg mb-4">📭 No appointment requests</p>
            <p className="text-slate-500">
              {filter === 'pending' 
                ? 'No pending requests. Check back soon!' 
                : 'No appointments in this category.'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

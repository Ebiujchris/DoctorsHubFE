import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import Link from 'next/link'
import { getCurrentUser, getAuthToken } from '../services/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function BookAppointment() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [provider, setProvider] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('error')

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    type: 'video',
    notes: ''
  })

  useEffect(() => {
    const u = getCurrentUser()
    if (!u) {
      router.push('/login')
      return
    }
    if (u.role !== 'patient') {
      router.push('/dashboard')
      return
    }
    setUser(u)

    // Get provider from localStorage or router params
    const savedProvider = localStorage.getItem('selectedProvider')
    if (savedProvider) {
      setProvider(JSON.parse(savedProvider))
      localStorage.removeItem('selectedProvider')
    }
  }, [router])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.date || !formData.time) {
      setMessageType('error')
      setMessage('Please select both date and time')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      // Combine date and time
      const startTime = new Date(`${formData.date}T${formData.time}:00`)
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 1 hour appointment

      const payload = {
        providerId: provider.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        consultationType: formData.type,
        notes: formData.notes || null
      }

      const response = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Booking failed')
      }

      setMessageType('success')
      setMessage('✅ Booking request sent! The provider will notify you of their response.')
      
      // Reset form
      setFormData({
        date: '',
        time: '',
        type: 'video',
        notes: ''
      })

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
    } catch (error) {
      console.error(error)
      setMessageType('error')
      setMessage(error.message || 'Booking failed')
    } finally {
      setLoading(false)
    }
  }

  if (!user || !provider) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="text-indigo-600 hover:text-indigo-700 font-medium mb-4 flex items-center gap-2"
            >
              ← Back
            </button>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Book Appointment</h1>
            <p className="text-slate-600">Schedule a consultation with your healthcare provider</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Provider Info Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-6">
                {/* Provider Image */}
                <div className="h-48 bg-gradient-to-br from-indigo-100 to-blue-100">
                  <img
                    src={provider.image}
                    alt={provider.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Provider Details */}
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">{provider.name}</h2>
                  <p className="text-indigo-600 font-semibold mb-4">{provider.specialty}</p>

                  {/* Stats */}
                  <div className="space-y-3 pb-4 border-b border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Experience</span>
                      <span className="font-semibold text-slate-800">{provider.experience}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Response Time</span>
                      <span className="font-semibold text-slate-800">{provider.responseTime}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Rating</span>
                      <span className="font-semibold text-slate-800">
                        <span className="text-yellow-400">⭐</span> {provider.rating}
                      </span>
                    </div>
                  </div>

                  {/* Reviews */}
                  <p className="text-sm text-slate-600 mt-4">
                    <span className="font-semibold">{provider.reviews}</span> patient reviews
                  </p>
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-8">
                {message && (
                  <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${
                    messageType === 'success'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {message}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Consultation Type */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Consultation Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all"
                        style={{
                          borderColor: formData.type === 'video' ? '#4f46e5' : '#e2e8f0',
                          backgroundColor: formData.type === 'video' ? '#eef2ff' : 'white'
                        }}>
                        <input
                          type="radio"
                          name="type"
                          value="video"
                          checked={formData.type === 'video'}
                          onChange={handleChange}
                          className="w-4 h-4 text-indigo-600"
                        />
                        <span className="ml-3">
                          <span className="text-lg font-semibold text-slate-800">📹 Video Call</span>
                          <p className="text-sm text-slate-600 mt-1">Consult from home</p>
                        </span>
                      </label>

                      <label className="relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all"
                        style={{
                          borderColor: formData.type === 'physical' ? '#4f46e5' : '#e2e8f0',
                          backgroundColor: formData.type === 'physical' ? '#eef2ff' : 'white'
                        }}>
                        <input
                          type="radio"
                          name="type"
                          value="physical"
                          checked={formData.type === 'physical'}
                          onChange={handleChange}
                          className="w-4 h-4 text-indigo-600"
                        />
                        <span className="ml-3">
                          <span className="text-lg font-semibold text-slate-800">👨‍⚕️ In-Person</span>
                          <p className="text-sm text-slate-600 mt-1">Visit clinic</p>
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Preferred Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Time */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Preferred Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-2">⏱️ Typical appointment duration: 1 hour</p>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Describe your symptoms or reason for visit..."
                      rows="4"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Summary */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-800 mb-3">📋 Booking Summary</h3>
                    <div className="space-y-2 text-sm text-slate-700">
                      <p><span className="font-medium">Provider:</span> {provider.name}</p>
                      <p><span className="font-medium">Type:</span> {formData.type === 'video' ? '📹 Video Consultation' : '👨‍⚕️ Physical Visit'}</p>
                      <p><span className="font-medium">Date:</span> {formData.date ? new Date(`${formData.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Not selected'}</p>
                      <p><span className="font-medium">Time:</span> {formData.time || 'Not selected'}</p>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
                    >
                      {loading ? 'Submitting...' : 'Request Appointment'}
                    </button>
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    <p className="font-semibold mb-2">ℹ️ What Happens Next?</p>
                    <p>The healthcare provider will review your request and respond within 24 hours. You'll receive a WhatsApp/SMS notification with their decision and meeting details if approved.</p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

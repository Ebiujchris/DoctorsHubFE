import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import Navbar from '../../components/Navbar'
import { getCurrentUser, getAuthToken } from '../../services/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function BookAppointment() {
  const router = useRouter()
  const { providerId } = router.query

  const [user, setUser]               = useState(null)
  const [provider, setProvider]       = useState(null)
  const [slots, setSlots]             = useState([])       // raw availability slots
  const [loadingProvider, setLoadingProvider] = useState(true)
  const [loadingSlots, setLoadingSlots]       = useState(false)
  const [bookingLoading, setBookingLoading]   = useState(false)
  const [message, setMessage]         = useState('')
  const [messageType, setMessageType] = useState('error')

  const [selectedDate, setSelectedDate] = useState(null)   // 'YYYY-MM-DD'
  const [selectedSlot, setSelectedSlot] = useState(null)   // availability object
  const [customStart, setCustomStart]   = useState('')      // HH:MM
  const [customEnd, setCustomEnd]       = useState('')      // HH:MM
  const [consultType, setConsultType]   = useState('video')
  const [notes, setNotes]               = useState('')

  // ── auth ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const u = getCurrentUser()
    if (!u) { router.push('/login'); return }
    if (u.role !== 'patient') { router.push('/dashboard'); return }
    setUser(u)
  }, [router])

  // ── fetch provider ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!providerId) return
    const fetch_ = async () => {
      try {
        setLoadingProvider(true)
        const res = await fetch(`${API_BASE}/users/${providerId}`)
        if (!res.ok) throw new Error('Provider not found')
        const d = await res.json()
        setProvider({
          id: d.id,
          name: `${d.firstName} ${d.lastName}`,
          specialty: d.specialty || d.role,
          rating: d.rating || 4.8,
          reviews: d.reviews || 0,
          experience: d.experience || 'N/A',
          responseTime: d.responseTime || '< 2 hours',
          fees: d.fees || null,
          image: d.profilePicture || `https://i.pravatar.cc/150?img=3`,
        })
      } catch (e) {
        setMessage(e.message); setMessageType('error')
      } finally { setLoadingProvider(false) }
    }
    fetch_()
  }, [providerId])

  // ── fetch availability slots ──────────────────────────────────────────────────
  useEffect(() => {
    if (!providerId) return
    const fetch_ = async () => {
      try {
        setLoadingSlots(true)
        const res = await fetch(`${API_BASE}/providers/${providerId}/availabilities`)
        if (res.ok) setSlots(await res.json())
      } catch (_) {}
      finally { setLoadingSlots(false) }
    }
    fetch_()
  }, [providerId])

  // ── derived: group slots by date ──────────────────────────────────────────────
  const slotsByDate = useMemo(() => {
    const map = {}
    slots.forEach(s => {
      const key = new Date(s.startTime).toISOString().split('T')[0]
      if (!map[key]) map[key] = []
      map[key].push(s)
    })
    return map
  }, [slots])

  const availableDates = Object.keys(slotsByDate).sort()
  const slotsForDate   = selectedDate ? (slotsByDate[selectedDate] || []) : []

  // ── calendar helpers ──────────────────────────────────────────────────────────
  const today = new Date(); today.setHours(0,0,0,0)
  const [calYear, setCalYear]   = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())

  const firstDay    = new Date(calYear, calMonth, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const cells = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1))

  const dateKey = (day) => `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  const hasAvail = (day) => day && availableDates.includes(dateKey(day))
  const isPast   = (day) => day && new Date(calYear, calMonth, day) < today
  const isToday  = (day) => {
    const t = new Date()
    return day === t.getDate() && calMonth === t.getMonth() && calYear === t.getFullYear()
  }

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  // helper: format Date → HH:MM for time input
  const toTimeInput = (iso) => {
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }

  // ── submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedSlot) { setMessageType('error'); setMessage('Please select an available time slot'); return }
    if (!customStart || !customEnd) { setMessageType('error'); setMessage('Please set both start and end time'); return }
    if (customEnd <= customStart) { setMessageType('error'); setMessage('End time must be after start time'); return }

    const token = getAuthToken()
    if (!token) { setMessageType('error'); setMessage('Session expired. Please login again.'); setTimeout(() => router.push('/login'), 2000); return }

    // Build ISO strings from selected date + custom times
    const startTime = new Date(`${selectedDate}T${customStart}:00`).toISOString()
    const endTime   = new Date(`${selectedDate}T${customEnd}:00`).toISOString()

    // Validate within slot bounds
    const slotStart = new Date(selectedSlot.startTime)
    const slotEnd   = new Date(selectedSlot.endTime)
    const chosenStart = new Date(`${selectedDate}T${customStart}:00`)
    const chosenEnd   = new Date(`${selectedDate}T${customEnd}:00`)
    if (chosenStart < slotStart || chosenEnd > slotEnd) {
      setMessageType('error')
      setMessage(`Please choose a time within ${toTimeInput(selectedSlot.startTime)} – ${toTimeInput(selectedSlot.endTime)}`)
      return
    }

    setBookingLoading(true); setMessage('')
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ providerId, startTime, endTime, consultationType: consultType, notes: notes || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || `Booking failed: ${res.status}`)
      setMessageType('success')
      setMessage('✅ Booking request sent! The provider will confirm shortly.')
      setTimeout(() => router.push('/dashboard'), 3000)
    } catch (e) {
      setMessageType('error')
      setMessage(e.message || 'Booking failed. Please try again.')
    } finally { setBookingLoading(false) }
  }

  // ── guards ────────────────────────────────────────────────────────────────────
  if (!user) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>

  if (loadingProvider) return (
    <div className="min-h-screen bg-slate-50"><Navbar />
      <main className="flex items-center justify-center py-20"><p className="text-slate-500">Loading provider...</p></main>
    </div>
  )

  if (!provider) return (
    <div className="min-h-screen bg-slate-50"><Navbar />
      <main className="max-w-xl mx-auto p-6 pt-16 text-center">
        <p className="text-red-600 font-semibold mb-4">Provider not found</p>
        <button onClick={() => router.push('/dashboard')} className="px-5 py-2 bg-indigo-600 text-white rounded-xl">Back to Dashboard</button>
      </main>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium mb-6 text-sm">
          ← Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Provider card ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden sticky top-6">
              <div className="h-44 bg-gradient-to-br from-indigo-100 to-blue-100">
                <img src={provider.image} alt={provider.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-5">
                <h2 className="text-xl font-bold text-slate-800">{provider.name}</h2>
                <p className="text-indigo-600 font-semibold text-sm mt-0.5">{provider.specialty}</p>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between"><span>Experience</span><span className="font-semibold text-slate-800">{provider.experience}</span></div>
                  <div className="flex justify-between"><span>Response</span><span className="font-semibold text-slate-800">{provider.responseTime}</span></div>
                  <div className="flex justify-between"><span>Rating</span><span className="font-semibold text-slate-800">⭐ {provider.rating}</span></div>
                  <div className="flex justify-between"><span>Reviews</span><span className="font-semibold text-slate-800">{provider.reviews}</span></div>
                  {provider.fees && (
                    <div className="flex justify-between pt-2 mt-2 border-t border-slate-100">
                      <span className="font-semibold text-slate-700">Consultation Fee</span>
                      <span className="font-bold text-emerald-600">{provider.fees}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Booking form ── */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h1 className="text-2xl font-bold text-slate-800 mb-1">Book Appointment</h1>
              <p className="text-slate-500 text-sm">Select an available slot from the calendar below</p>
            </div>

            {message && (
              <div className={`px-5 py-4 rounded-2xl text-sm font-medium ${messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Consultation type */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-sm font-semibold text-slate-700 mb-3">Consultation Type</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'video',    label: '📹 Video Call',  sub: 'Consult from home' },
                    { value: 'physical', label: '👨‍⚕️ In-Person',   sub: 'Visit the clinic'  },
                  ].map(t => (
                    <button key={t.value} type="button" onClick={() => setConsultType(t.value)}
                      className={`p-4 rounded-xl border-2 text-left transition ${consultType === t.value ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}>
                      <p className="font-semibold text-slate-800 text-sm">{t.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{t.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Calendar */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-sm font-semibold text-slate-700 mb-4">Select a Date</p>

                {loadingSlots ? (
                  <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Loading available dates...</div>
                ) : availableDates.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-center">
                    <p className="text-3xl mb-2">📅</p>
                    <p className="text-slate-600 font-medium text-sm">No availability set yet</p>
                    <p className="text-slate-400 text-xs mt-1">This provider hasn't added any open slots yet.</p>
                  </div>
                ) : (
                  <>
                    {/* month nav */}
                    <div className="flex items-center justify-between mb-4">
                      <button type="button" onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y=>y-1) } else setCalMonth(m=>m-1) }}
                        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600">‹</button>
                      <span className="font-semibold text-slate-700 text-sm">{MONTHS[calMonth]} {calYear}</span>
                      <button type="button" onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y=>y+1) } else setCalMonth(m=>m+1) }}
                        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600">›</button>
                    </div>

                    <div className="grid grid-cols-7 mb-1">
                      {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>)}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {cells.map((day, i) => {
                        if (!day) return <div key={i} />
                        const past  = isPast(day)
                        const avail = hasAvail(day)
                        const key   = dateKey(day)
                        const sel   = selectedDate === key
                        return (
                          <button key={i} type="button"
                            onClick={() => { if (!past && avail) { setSelectedDate(key); setSelectedSlot(null) } }}
                            disabled={past || !avail}
                            className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all relative
                              ${past || !avail ? 'text-slate-300 cursor-not-allowed' : 'cursor-pointer'}
                              ${sel ? 'bg-indigo-600 text-white' : ''}
                              ${avail && !sel && !past ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' : ''}
                              ${isToday(day) && !sel ? 'ring-2 ring-indigo-400' : ''}
                            `}
                          >
                            {day}
                            {avail && !sel && <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                          </button>
                        )
                      })}
                    </div>

                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xl bg-indigo-50 border border-indigo-200" /> Available</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xl bg-indigo-600" /> Selected</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xl bg-slate-100" /> Unavailable</span>
                    </div>
                  </>
                )}
              </div>

              {/* Time slots + time picker */}
              {selectedDate && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-1">
                      Available Slots — {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
                    </p>
                    <p className="text-xs text-slate-400 mb-3">Select a slot, then adjust your preferred start and end time within it</p>

                    {slotsForDate.length === 0 ? (
                      <p className="text-slate-400 text-sm">No slots available for this date.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {slotsForDate.map(s => {
                          const sel = selectedSlot?.id === s.id
                          return (
                            <button key={s.id} type="button"
                              onClick={() => {
                                setSelectedSlot(s)
                                setCustomStart(toTimeInput(s.startTime))
                                setCustomEnd(toTimeInput(s.endTime))
                              }}
                              className={`p-3 rounded-xl border-2 text-center transition ${sel ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}>
                              <p className="text-sm font-semibold text-slate-800">
                                {new Date(s.startTime).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                – {new Date(s.endTime).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}
                              </p>
                              {sel && <p className="text-xs text-indigo-600 font-semibold mt-1">Selected ✓</p>}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Time pickers — only shown after a slot is selected */}
                  {selectedSlot && (
                    <div className="border-t border-slate-100 pt-4">
                      <p className="text-sm font-semibold text-slate-700 mb-1">Choose Your Time</p>
                      <p className="text-xs text-slate-400 mb-3">
                        Slot window: {new Date(selectedSlot.startTime).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})} – {new Date(selectedSlot.endTime).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Start Time</label>
                          <input
                            type="time"
                            value={customStart}
                            min={toTimeInput(selectedSlot.startTime)}
                            max={toTimeInput(selectedSlot.endTime)}
                            onChange={e => setCustomStart(e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 mb-1.5 block">End Time</label>
                          <input
                            type="time"
                            value={customEnd}
                            min={toTimeInput(selectedSlot.startTime)}
                            max={toTimeInput(selectedSlot.endTime)}
                            onChange={e => setCustomEnd(e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Notes (Optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Describe your symptoms or reason for visit..."
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
              </div>

              {/* Summary + submit */}
              {selectedSlot && customStart && customEnd && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
                  <p className="text-sm font-semibold text-slate-800 mb-3">📋 Booking Summary</p>
                  <div className="space-y-1.5 text-sm text-slate-700">
                    <p><span className="font-medium">Provider:</span> {provider.name}</p>
                    <p><span className="font-medium">Type:</span> {consultType === 'video' ? '📹 Video Call' : '👨‍⚕️ In-Person'}</p>
                    <p><span className="font-medium">Date:</span> {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</p>
                    <p><span className="font-medium">Start:</span> {customStart}</p>
                    <p><span className="font-medium">End:</span> {customEnd}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => router.back()}
                  className="flex-1 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={bookingLoading || !selectedSlot || !customStart || !customEnd || !getAuthToken()}
                  className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm">
                  {bookingLoading ? 'Submitting...' : 'Request Appointment'}
                </button>
              </div>

              <p className="text-xs text-slate-400 text-center">
                The provider will review your request and confirm within 24 hours. You'll be notified via the app.
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

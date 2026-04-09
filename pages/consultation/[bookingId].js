import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { getCurrentUser, getAuthToken } from '../../services/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const PROVIDER_ROLES = ['doctor', 'nurse', 'psychiatrist', 'carer']

export default function ConsultationPage() {
  const router = useRouter()
  const { bookingId } = router.query

  const [user, setUser]         = useState(null)
  const [booking, setBooking]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [callActive, setCallActive] = useState(false)
  const [elapsed, setElapsed]   = useState(0)          // seconds
  const [notes, setNotes]       = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [noteSaved, setNoteSaved]   = useState(false)
  const [jitsiApi, setJitsiApi] = useState(null)
  const [jitsiLoaded, setJitsiLoaded] = useState(false)
  const timerRef = useRef(null)
  const jitsiRef = useRef(null)

  const isProvider = user ? PROVIDER_ROLES.includes(user.role) : false

  // Load Jitsi External API script
  useEffect(() => {
    const loadJitsiScript = () => {
      if (window.JitsiMeetExternalAPI) {
        setJitsiLoaded(true)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://meet.jit.si/external_api.js'
      script.async = true
      script.onload = () => setJitsiLoaded(true)
      script.onerror = () => {
        console.error('Failed to load Jitsi External API')
        setJitsiLoaded(false)
      }
      document.head.appendChild(script)
    }

    loadJitsiScript()
  }, [])

  // ── load booking ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const u = getCurrentUser()
    if (!u) { router.replace('/login'); return }
    setUser(u)
  }, [router])

  useEffect(() => {
    if (!bookingId || !user) return
    const token = getAuthToken()
    fetch(`${API_BASE}/bookings/${bookingId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error('Booking not found'); return r.json() })
      .then(data => {
        if (data.consultationType !== 'video') { setError('This is not a video consultation.'); setLoading(false); return }
        if (data.status !== 'confirmed')       { setError('This appointment has not been confirmed yet.'); setLoading(false); return }
        if (!data.meetingLink)                 { setError('Meeting link not available yet.'); setLoading(false); return }
        setBooking(data)
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [bookingId, user])

  // ── load existing consultation note ──────────────────────────────────────────
  useEffect(() => {
    if (!bookingId || !user) return
    const token = getAuthToken()
    fetch(`${API_BASE}/consultation-notes/booking/${bookingId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => {
        const text = await r.text()
        if (!text || text === 'null') return
        try {
          const data = JSON.parse(text)
          if (data?.notes) setNotes(data.notes)
        } catch (_) {}
      })
      .catch(() => {})
  }, [bookingId, user])

  // ── call timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (callActive) {
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [callActive])

  const formatTime = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return h > 0
      ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
      : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  const handleStartCall = () => {
    if (!jitsiLoaded || !window.JitsiMeetExternalAPI) {
      console.error('Jitsi API not loaded yet')
      return
    }

    setCallActive(true)
    setElapsed(0)
  }

  // Initialize Jitsi when call becomes active and container is ready
  useEffect(() => {
    if (!callActive || !jitsiRef.current || !jitsiLoaded || jitsiApi) return

    const initializeJitsi = () => {
      try {
        const roomName = booking.meetingLink.split('/').pop()
        const domain = 'meet.jit.si'
        
        const options = {
          roomName: roomName,
          width: '100%',
          height: '100%',
          parentNode: jitsiRef.current,
          userInfo: {
            displayName: `${user.firstName} ${user.lastName}`,
            email: user.email
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            enableWelcomePage: false,
            prejoinPageEnabled: false,
            disableModeratorIndicator: true,
            startScreenSharing: false,
            enableEmailInStats: false
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
              'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
              'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone'
            ],
            SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile', 'calendar'],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            BRAND_WATERMARK_LINK: '',
            SHOW_POWERED_BY: false,
            SHOW_PROMOTIONAL_CLOSE_PAGE: false,
            SHOW_CHROME_EXTENSION_BANNER: false
          }
        }
        
        const api = new window.JitsiMeetExternalAPI(domain, options)
        setJitsiApi(api)
        
        // Event listeners
        api.addEventListener('videoConferenceJoined', () => {
          console.log('Joined the conference')
        })
        
        api.addEventListener('videoConferenceLeft', () => {
          console.log('Left the conference')
          handleEndCall()
        })
        
        api.addEventListener('participantLeft', () => {
          console.log('Participant left')
        })
      } catch (error) {
        console.error('Error initializing Jitsi:', error)
        setCallActive(false)
      }
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initializeJitsi, 100)
    return () => clearTimeout(timer)
  }, [callActive, jitsiLoaded, booking, user, jitsiApi])

  const handleEndCall = () => {
    setCallActive(false)
    // Clean up Jitsi API
    if (jitsiApi) {
      try {
        jitsiApi.dispose()
      } catch (error) {
        console.error('Error disposing Jitsi API:', error)
      }
      setJitsiApi(null)
    }
    // auto-save notes on end
    if (notes.trim()) saveNote()
  }

  const saveNote = async () => {
    if (!notes.trim() || !isProvider) return
    setSavingNote(true)
    const token = getAuthToken()
    try {
      // Check if note exists first
      const checkRes = await fetch(`${API_BASE}/consultation-notes/booking/${bookingId}`, { headers: { Authorization: `Bearer ${token}` } })
      const checkText = await checkRes.text()
      const existing = checkText && checkText !== 'null' ? JSON.parse(checkText) : null

      if (existing) {
        await fetch(`${API_BASE}/consultation-notes/${existing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ notes }),
        })
      } else {
        await fetch(`${API_BASE}/consultation-notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ bookingId, notes }),
        })
      }
      setNoteSaved(true)
      setTimeout(() => setNoteSaved(false), 2000)
    } catch (_) {}
    finally { setSavingNote(false) }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (jitsiApi) {
        try {
          jitsiApi.dispose()
        } catch (error) {
          console.error('Error disposing Jitsi API on unmount:', error)
        }
      }
      clearInterval(timerRef.current)
    }
  }, [jitsiApi])

  // ── guards ────────────────────────────────────────────────────────────────────
  if (!user || loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full text-center">
        <p className="text-4xl mb-4">⚠️</p>
        <p className="text-white font-semibold text-lg mb-2">{error}</p>
        <button onClick={() => router.push('/dashboard')} className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition">
          Back to Dashboard
        </button>
      </div>
    </div>
  )

  const other = isProvider ? booking.patient : booking.provider
  const otherLabel = isProvider ? 'Patient' : 'Provider'

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* ── Top bar ── */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">DH</div>
          <div>
            <p className="text-white font-semibold text-sm">Video Consultation</p>
            <p className="text-slate-400 text-xs">
              {new Date(booking.startTime).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}
              {' · '}
              {new Date(booking.startTime).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {callActive && (
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 rounded-full px-3 py-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 text-sm font-mono font-semibold">{formatTime(elapsed)}</span>
            </div>
          )}
          <button onClick={() => router.push('/dashboard')} className="px-3 py-1.5 text-slate-400 hover:text-white text-sm transition">
            ✕ Exit
          </button>
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Video area ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {!callActive ? (
            /* Pre-call lobby */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center text-4xl mb-6">
                {isProvider ? '🩺' : '👤'}
              </div>
              <h2 className="text-white text-2xl font-bold mb-2">
                {isProvider ? `Consultation with ${other.firstName} ${other.lastName}` : `Call with Dr. ${other.firstName} ${other.lastName}`}
              </h2>
              <p className="text-slate-400 mb-2">{other.specialty || other.role}</p>
              <p className="text-slate-500 text-sm mb-8">
                {new Date(booking.startTime).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}
                {' – '}
                {new Date(booking.endTime).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={handleStartCall}
                  disabled={!jitsiLoaded}
                  className="flex items-center gap-2 px-8 py-3.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition text-lg shadow-lg shadow-green-900/40">
                  📹 {jitsiLoaded ? 'Start Call' : 'Loading...'}
                </button>
                <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-2xl transition text-sm">
                  🔗 Open in Jitsi App
                </a>
              </div>

              <p className="text-slate-600 text-xs mt-6">
                Meeting ID: <span className="text-slate-500 font-mono">{booking.meetingLink?.split('/').pop()}</span>
              </p>
            </div>
          ) : (
            /* Active call — Jitsi container */
            <div className="flex-1 flex flex-col">
              <div 
                ref={jitsiRef}
                className="flex-1 w-full"
                style={{ minHeight: '400px' }}
              />
              {/* End call bar */}
              <div className="bg-slate-800 border-t border-slate-700 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-400 text-sm font-mono font-semibold">{formatTime(elapsed)}</span>
                  <span className="text-slate-500 text-xs ml-2">Call in progress</span>
                </div>
                <button onClick={handleEndCall}
                  className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition">
                  📵 End Call
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div className="w-80 flex-shrink-0 bg-slate-800 border-l border-slate-700 flex flex-col overflow-hidden">

          {/* Patient / Provider info */}
          <div className="p-5 border-b border-slate-700">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{otherLabel}</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                {other.firstName?.[0]}{other.lastName?.[0]}
              </div>
              <div>
                <p className="text-white font-semibold">{other.firstName} {other.lastName}</p>
                <p className="text-slate-400 text-xs capitalize">{other.specialty || other.role}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <span>📧</span>
                <a href={`mailto:${other.email}`} className="text-indigo-400 hover:underline truncate">{other.email}</a>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span>📱</span>
                <a href={`tel:${other.phone}`} className="text-indigo-400 hover:underline">{other.phone}</a>
              </div>
            </div>
          </div>

          {/* Appointment info */}
          <div className="p-5 border-b border-slate-700">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Appointment</p>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Date</span>
                <span className="text-slate-200">{new Date(booking.startTime).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
              </div>
              <div className="flex justify-between">
                <span>Time</span>
                <span className="text-slate-200">
                  {new Date(booking.startTime).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}
                  {' – '}
                  {new Date(booking.endTime).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Type</span>
                <span className="text-slate-200">📹 Video</span>
              </div>
            </div>
            {booking.notes && (
              <div className="mt-3 bg-slate-700 rounded-xl p-3">
                <p className="text-xs font-semibold text-slate-400 mb-1">Patient Notes</p>
                <p className="text-xs text-slate-300">{booking.notes}</p>
              </div>
            )}
          </div>

          {/* Notes section — provider only */}
          {isProvider && (
            <div className="flex-1 flex flex-col p-5 min-h-0">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Consultation Notes</p>
                {noteSaved && <span className="text-xs text-green-400">✓ Saved</span>}
              </div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Record diagnosis, observations, recommendations..."
                className="flex-1 w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none min-h-[120px]"
              />
              <button onClick={saveNote} disabled={savingNote || !notes.trim()}
                className="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition">
                {savingNote ? 'Saving...' : '💾 Save Notes'}
              </button>
            </div>
          )}

          {/* Patient: read-only notes view */}
          {!isProvider && (
            <div className="flex-1 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Session Info</p>
              <div className="bg-slate-700 rounded-xl p-4 text-xs text-slate-400 space-y-2">
                <p>📹 Your video consultation is in progress.</p>
                <p>Your provider will record notes and any prescriptions after the session.</p>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
  )
}

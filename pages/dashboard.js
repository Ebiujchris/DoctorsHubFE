import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import { getCurrentUser, getAuthToken, logout } from '../services/auth'
import { fetchFeaturedDoctors_Combined, fetchNotifications, markAllNotificationsRead, cancelBooking } from '../services/api'
import { useTheme } from '../hooks/useTheme'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const PROVIDER_ROLES = ['doctor', 'nurse', 'psychiatrist', 'carer']

// Dark-aware notification type colours
const typeColor = {
  booking_created:   'border-l-indigo-400 bg-indigo-50 dark:bg-indigo-950/40',
  booking_confirmed: 'border-l-green-400 bg-green-50 dark:bg-green-950/40',
  booking_rejected:  'border-l-red-400 bg-red-50 dark:bg-red-950/40',
  booking_cancelled: 'border-l-yellow-400 bg-yellow-50 dark:bg-yellow-950/40',
  general:           'border-l-blue-400 bg-blue-50 dark:bg-blue-950/40',
}

const STATUS = {
  pending:   { label: 'Pending',   cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300', dot: 'bg-yellow-400' },
  confirmed: { label: 'Confirmed', cls: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',   dot: 'bg-green-500'  },
  rejected:  { label: 'Rejected',  cls: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',       dot: 'bg-red-500'    },
  cancelled: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',   dot: 'bg-slate-400'  },
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
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

// ── ChatTab — standalone component so it never remounts on Dashboard re-render ─
function ChatTab({ userId, isProvider, appointments, onUnreadChange }) {
  const [socket, setSocket]               = useState(null)
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv]       = useState(null)
  const [messages, setMessages]           = useState([])
  const [input, setInput]                 = useState('')
  const [typing, setTyping]               = useState(false)
  const [otherTyping, setOtherTyping]     = useState(false)
  const [unread, setUnread]               = useState({})
  const [newMsgFrom, setNewMsgFrom]       = useState({}) // userId → true when new msg arrives
  const [loadingHistory, setLoadingHistory] = useState(false)
  const messagesEndRef  = useRef(null)
  const activeConvRef   = useRef(null)
  const socketRef       = useRef(null)
  const API_BASE_CHAT   = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  const accent          = isProvider ? 'bg-emerald-600' : 'bg-indigo-600'

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Keep ref in sync
  useEffect(() => { activeConvRef.current = activeConv }, [activeConv])

  // Connect socket once on mount
  useEffect(() => {
    const token = getAuthToken()
    if (!token) return
    const { io } = require('socket.io-client')
    const s = io(`${API_BASE_CHAT}/chat`, { auth: { token }, transports: ['websocket'] })
    socketRef.current = s
    setSocket(s)

    s.on('newMessage', (msg) => {
      setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg])
      setUnread(prev => {
        if (activeConvRef.current?.id === msg.senderId) return prev
        const next = { ...prev, [msg.senderId]: (prev[msg.senderId] || 0) + 1 }
        const total = Object.values(next).reduce((a, b) => a + b, 0)
        onUnreadChange?.(total)
        return next
      })
      // pulse the conversation row — stays until opened
      if (activeConvRef.current?.id !== msg.senderId) {
        setNewMsgFrom(prev => ({ ...prev, [msg.senderId]: true }))
      }
    })
    s.on('typing', ({ senderId, isTyping }) => {
      if (activeConvRef.current?.id === senderId) setOtherTyping(isTyping)
    })
    return () => { s.disconnect(); socketRef.current = null }
  }, []) // empty — only runs once

  // Load conversation list + seed unread counts from DB
  useEffect(() => {
    const token = getAuthToken()
    if (!token) return

    Promise.all([
      fetch(`${API_BASE_CHAT}/chat/conversations`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE_CHAT}/chat/unread-per-conversation`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : {}),
    ]).then(([convData, unreadData]) => {
      setConversations(prev => {
        const merged = new Map(convData.map(u => [u.id, u]))
        if (!isProvider) {
          appointments.forEach(a => { if (a.provider) merged.set(a.provider.id, a.provider) })
        }
        return Array.from(merged.values())
      })

      // Seed unread counts from DB
      if (Object.keys(unreadData).length > 0) {
        setUnread(unreadData)
        const total = Object.values(unreadData).reduce((a, b) => a + b, 0)
        onUnreadChange?.(total)
        // Mark all senders with unread as having new messages
        const newFrom = {}
        Object.keys(unreadData).forEach(id => { if (unreadData[id] > 0) newFrom[id] = true })
        setNewMsgFrom(newFrom)
      }
    }).catch(() => {})
  }, [appointments])

  // Load history when active conversation changes
  useEffect(() => {
    if (!activeConv) return
    const token = getAuthToken()
    setLoadingHistory(true)
    setMessages([])
    fetch(`${API_BASE_CHAT}/chat/history/${activeConv.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setMessages(data.map(m => ({
          id: m.id, content: m.content, createdAt: m.createdAt,
          senderId: m.sender.id, receiverId: m.receiver.id,
        })))
        setLoadingHistory(false)
      })
      .catch(() => setLoadingHistory(false))
    socketRef.current?.emit('markRead', { senderId: activeConv.id })
    setUnread(prev => {
      const next = { ...prev, [activeConv.id]: 0 }
      const total = Object.values(next).reduce((a, b) => a + b, 0)
      onUnreadChange?.(total)
      return next
    })
    setNewMsgFrom(prev => ({ ...prev, [activeConv.id]: false }))
  }, [activeConv?.id])

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current || !activeConv) return
    socketRef.current.emit('sendMessage', { receiverId: activeConv.id, content: input.trim() })
    socketRef.current.emit('typing', { receiverId: activeConv.id, isTyping: false })
    setInput(''); setTyping(false)
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)
    if (!socketRef.current || !activeConv) return
    if (!typing) {
      setTyping(true)
      socketRef.current.emit('typing', { receiverId: activeConv.id, isTyping: true })
    }
    clearTimeout(window._dhTypingTimer)
    window._dhTypingTimer = setTimeout(() => {
      setTyping(false)
      socketRef.current?.emit('typing', { receiverId: activeConv.id, isTyping: false })
    }, 1500)
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* conversation list */}
      <div className="w-64 flex-shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-semibold text-slate-800 dark:text-white text-sm">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="p-4 text-center text-slate-400 text-xs mt-4">
              {isProvider ? 'No conversations yet' : 'Book an appointment to start chatting'}
            </p>
          ) : conversations.map(u => (
            <button key={u.id} onClick={() => setActiveConv(u)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition border-b border-slate-100 dark:border-slate-700/50 ${activeConv?.id === u.id ? 'bg-slate-100 dark:bg-slate-700' : ''}`}>
              <div className="relative flex-shrink-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${accent}`}>
                  {u.firstName?.[0]}{u.lastName?.[0]}
                </div>
                {/* pulsing green dot for new message */}
                {newMsgFrom[u.id] && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 animate-ping" />
                )}
                {newMsgFrom[u.id] && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium truncate ${newMsgFrom[u.id] ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-800 dark:text-slate-100'}`}>
                  {u.firstName} {u.lastName}
                </p>
                <p className="text-xs text-slate-400 capitalize truncate">{u.specialty || u.role}</p>
              </div>
              {unread[u.id] > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 flex-shrink-0">
                  {unread[u.id]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* chat window */}
      <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col overflow-hidden">
        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <p className="text-4xl mb-3">💬</p>
            <p className="font-semibold text-slate-700 dark:text-slate-200">Select a conversation</p>
            <p className="text-sm text-slate-400 mt-1">Choose someone from the left to start chatting</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${accent}`}>
                {activeConv.firstName?.[0]}{activeConv.lastName?.[0]}
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-white text-sm">{activeConv.firstName} {activeConv.lastName}</p>
                <p className="text-xs text-slate-400 capitalize">{activeConv.specialty || activeConv.role}</p>
              </div>
              {otherTyping && <p className="ml-auto text-xs text-slate-400 italic animate-pulse">typing...</p>}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {loadingHistory ? (
                <div className="flex justify-center pt-8"><div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>
              ) : messages.length === 0 ? (
                <p className="text-center text-slate-400 text-sm pt-8">No messages yet. Say hello! 👋</p>
              ) : messages.map(m => {
                const mine = m.senderId === userId
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${mine ? `${accent} text-white rounded-br-sm` : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-sm'}`}>
                      <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      <p className={`text-xs mt-1 ${mine ? 'text-white/60' : 'text-slate-400'}`}>
                        {new Date(m.createdAt).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex gap-2">
              <textarea value={input} onChange={handleInputChange} onKeyDown={handleKeyDown}
                placeholder="Type a message... (Enter to send)"
                rows={1}
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
              <button onClick={sendMessage} disabled={!input.trim()}
                className={`px-4 py-2.5 ${accent} text-white rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition flex-shrink-0`}>
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── ConsultationNotesTab — standalone so it never remounts ───────────────────
const API_BASE_MEDICAL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function ConsultationNotesTab({ isProvider, appointments }) {
  const [notes, setNotes]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [modal, setModal]       = useState(null)
  const [editNote, setEditNote] = useState(null)
  const [form, setForm]         = useState({ diagnosis: '', notes: '', recommendation: '' })
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    const token = getAuthToken()
    fetch(`${API_BASE_MEDICAL}/consultation-notes`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setNotes(data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const openCreate = (booking) => { setModal(booking); setEditNote(null); setForm({ diagnosis: '', notes: '', recommendation: '' }) }
  const openEdit   = (note)    => { setEditNote(note); setModal(null);    setForm({ diagnosis: note.diagnosis || '', notes: note.notes || '', recommendation: note.recommendation || '' }) }
  const closeModal = ()        => { setModal(null); setEditNote(null) }

  const handleSave = async () => {
    setSaving(true)
    const token = getAuthToken()
    try {
      let res, data
      if (editNote) {
        res  = await fetch(`${API_BASE_MEDICAL}/consultation-notes/${editNote.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) })
        data = await res.json()
        if (!res.ok) throw new Error(data.message)
        setNotes(prev => prev.map(n => n.id === editNote.id ? data : n))
      } else {
        res  = await fetch(`${API_BASE_MEDICAL}/consultation-notes`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ bookingId: modal.id, ...form }) })
        data = await res.json()
        if (!res.ok) throw new Error(data.message)
        setNotes(prev => [data, ...prev])
      }
      closeModal()
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  const confirmedWithoutNote = isProvider
    ? appointments.filter(a => a.status === 'confirmed' && !notes.find(n => n.booking?.id === a.id))
    : []

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{isProvider ? 'Consultation Notes' : 'My Medical Notes'}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{isProvider ? 'Record diagnosis and recommendations after appointments' : 'Notes from your healthcare providers'}</p>
      </div>

      {isProvider && confirmedWithoutNote.length > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-2xl p-4">
          <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-3">📝 Add notes for recent appointments</p>
          <div className="flex flex-wrap gap-2">
            {confirmedWithoutNote.slice(0, 5).map(a => (
              <button key={a.id} onClick={() => openCreate(a)} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition">
                {a.patient?.firstName} {a.patient?.lastName} · {new Date(a.startTime).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-28 bg-slate-100 dark:bg-slate-700 rounded-2xl animate-pulse" />)}</div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-2xl p-5 text-center"><p className="text-red-600 text-sm">⚠️ {error}</p></div>
      ) : notes.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <p className="text-4xl mb-3">📝</p><p className="text-slate-600 dark:text-slate-300 font-medium">No consultation notes yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(n => (
            <div key={n.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white">{isProvider ? `${n.patient?.firstName} ${n.patient?.lastName}` : `Dr. ${n.provider?.firstName} ${n.provider?.lastName}`}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(n.createdAt).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'})}</p>
                </div>
                {isProvider && <button onClick={() => openEdit(n)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Edit</button>}
              </div>
              <div className="space-y-2">
                {n.diagnosis     && <div className="bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2.5"><p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-0.5">Diagnosis</p><p className="text-sm text-slate-700 dark:text-slate-200">{n.diagnosis}</p></div>}
                {n.notes         && <div className="bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-2.5"><p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-0.5">Notes</p><p className="text-sm text-slate-700 dark:text-slate-200">{n.notes}</p></div>}
                {n.recommendation && <div className="bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-2.5"><p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-0.5">Recommendation</p><p className="text-sm text-slate-700 dark:text-slate-200">{n.recommendation}</p></div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {(modal || editNote) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-white font-bold">{editNote ? 'Edit Note' : 'New Consultation Note'}</h2>
              <button onClick={closeModal} className="text-white/80 hover:text-white">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {modal && <p className="text-sm text-slate-500 dark:text-slate-400">Patient: <span className="font-semibold text-slate-700 dark:text-slate-200">{modal.patient?.firstName} {modal.patient?.lastName}</span></p>}
              {['diagnosis', 'notes', 'recommendation'].map(field => (
                <div key={field}>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-1.5 block capitalize">{field}</label>
                  <textarea value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} rows={3} placeholder={`Enter ${field}...`}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition">{saving ? 'Saving...' : 'Save Note'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── PrescriptionsTab — standalone so it never remounts ───────────────────────
function PrescriptionsTab({ isProvider, appointments }) {
  const [rxList, setRxList]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(null)
  const [saving, setSaving]     = useState(false)
  const [meds, setMeds]         = useState([{ name: '', dosage: '', frequency: '', duration: '', notes: '' }])
  const [instructions, setInstructions] = useState('')
  const [refillDate, setRefillDate]     = useState('')

  useEffect(() => {
    const token = getAuthToken()
    fetch(`${API_BASE_MEDICAL}/prescriptions`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setRxList(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const addMed    = ()              => setMeds(p => [...p, { name: '', dosage: '', frequency: '', duration: '', notes: '' }])
  const removeMed = (i)             => setMeds(p => p.filter((_, idx) => idx !== i))
  const updateMed = (i, field, val) => setMeds(p => p.map((m, idx) => idx === i ? { ...m, [field]: val } : m))

  const handleCreate = async () => {
    if (!modal || meds.some(m => !m.name || !m.dosage)) { alert('Fill in all medication fields'); return }
    setSaving(true)
    try {
      const res  = await fetch(`${API_BASE_MEDICAL}/prescriptions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` }, body: JSON.stringify({ bookingId: modal.id, medications: meds, instructions, refillDate: refillDate || undefined }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setRxList(prev => [data, ...prev])
      setModal(null); setMeds([{ name: '', dosage: '', frequency: '', duration: '', notes: '' }]); setInstructions(''); setRefillDate('')
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  const printPDF = (rx) => {
    const win = window.open('', '_blank')
    win.document.write(`<html><head><title>Prescription</title><style>body{font-family:Arial,sans-serif;padding:40px;max-width:600px;margin:0 auto}h1{color:#4f46e5;border-bottom:2px solid #4f46e5;padding-bottom:8px}.med{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin:8px 0}.label{font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase}.val{font-size:14px;color:#1e293b;margin-top:2px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}</style></head><body><h1>💊 Prescription</h1><p><span class="label">Provider</span><br><span class="val">Dr. ${rx.provider?.firstName} ${rx.provider?.lastName}</span></p><p><span class="label">Patient</span><br><span class="val">${rx.patient?.firstName} ${rx.patient?.lastName}</span></p><p><span class="label">Date</span><br><span class="val">${new Date(rx.createdAt).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</span></p>${rx.refillDate?`<p><span class="label">Refill Date</span><br><span class="val">${rx.refillDate}</span></p>`:''}<h2 style="margin-top:24px">Medications</h2>${rx.medications.map(m=>`<div class="med"><strong>${m.name}</strong><div class="grid" style="margin-top:8px"><div><span class="label">Dosage</span><div class="val">${m.dosage}</div></div><div><span class="label">Frequency</span><div class="val">${m.frequency}</div></div><div><span class="label">Duration</span><div class="val">${m.duration}</div></div>${m.notes?`<div><span class="label">Notes</span><div class="val">${m.notes}</div></div>`:''}</div></div>`).join('')}${rx.instructions?`<p style="margin-top:16px"><span class="label">Instructions</span><br><span class="val">${rx.instructions}</span></p>`:''}<p style="margin-top:40px;font-size:11px;color:#94a3b8">Generated by DoctorsHub · ${new Date().toLocaleString()}</p></body></html>`)
    win.document.close(); win.print()
  }

  const confirmedApts = isProvider ? appointments.filter(a => a.status === 'confirmed') : []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Prescriptions</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{isProvider ? 'Create and manage patient prescriptions' : 'Your prescriptions from providers'}</p>
        </div>
        {isProvider && (
          <select onChange={e => { const a = appointments.find(x => x.id === e.target.value); if (a) setModal(a); e.target.value = '' }}
            className="px-3 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl cursor-pointer focus:outline-none">
            <option value="">+ New Prescription</option>
            {confirmedApts.map(a => <option key={a.id} value={a.id}>{a.patient?.firstName} {a.patient?.lastName} · {new Date(a.startTime).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-700 rounded-2xl animate-pulse" />)}</div>
      ) : rxList.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <p className="text-4xl mb-3">💊</p><p className="text-slate-600 dark:text-slate-300 font-medium">No prescriptions yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rxList.map(rx => (
            <div key={rx.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white">{isProvider ? `${rx.patient?.firstName} ${rx.patient?.lastName}` : `Dr. ${rx.provider?.firstName} ${rx.provider?.lastName}`}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(rx.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</p>
                  {rx.refillDate && <p className={`text-xs font-semibold mt-1 ${new Date(rx.refillDate) <= new Date() ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>🔄 Refill: {rx.refillDate} {new Date(rx.refillDate) <= new Date() ? '⚠️ Due!' : ''}</p>}
                </div>
                <button onClick={() => printPDF(rx)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition">🖨️ Print / PDF</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {rx.medications.map((m, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-700 rounded-xl p-3">
                    <p className="font-semibold text-slate-800 dark:text-white text-sm">{m.name}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                      <span>💊 {m.dosage}</span><span>🕐 {m.frequency}</span><span>📅 {m.duration}</span>{m.notes && <span>📝 {m.notes}</span>}
                    </div>
                  </div>
                ))}
              </div>
              {rx.instructions && <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl px-3 py-2">📋 {rx.instructions}</p>}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl my-4">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-white font-bold">New Prescription — {modal.patient?.firstName} {modal.patient?.lastName}</h2>
              <button onClick={() => setModal(null)} className="text-white/80 hover:text-white">✕</button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-3">
                {meds.map((m, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Medication {i + 1}</p>
                      {meds.length > 1 && <button onClick={() => removeMed(i)} className="text-red-400 text-xs hover:text-red-600">Remove</button>}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[['name','Drug Name'],['dosage','Dosage'],['frequency','Frequency'],['duration','Duration']].map(([f, lbl]) => (
                        <div key={f}>
                          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">{lbl}</label>
                          <input value={m[f]} onChange={e => updateMed(i, f, e.target.value)} placeholder={lbl}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        </div>
                      ))}
                    </div>
                    <input value={m.notes} onChange={e => updateMed(i, 'notes', e.target.value)} placeholder="Additional notes (optional)"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                ))}
                <button onClick={addMed} className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-sm rounded-xl hover:border-indigo-400 hover:text-indigo-600 transition">+ Add Another Medication</button>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">Instructions</label>
                <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={2} placeholder="General instructions..."
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">Refill Date (optional)</label>
                <input type="date" value={refillDate} onChange={e => setRefillDate(e.target.value)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition">Cancel</button>
                <button onClick={handleCreate} disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition">{saving ? 'Creating...' : 'Create Prescription'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── ProviderReviewsList — standalone ─────────────────────────────────────────
function ProviderReviewsList({ providerId }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  useEffect(() => {
    fetch(`${API}/reviews/provider/${providerId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setReviews(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [providerId])

  if (loading) return <div className="h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl animate-pulse" />
  if (reviews.length === 0) return (
    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-center">
      <p className="text-slate-500 dark:text-slate-400 text-sm">No reviews yet</p>
    </div>
  )
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200">Patient Reviews</h3>
        <span className="text-sm text-slate-500 dark:text-slate-400">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {reviews.map(r => (
          <div key={r.id} className="border border-slate-100 dark:border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{r.patient?.firstName} {r.patient?.lastName}</p>
              <div className="flex gap-0.5">{[1,2,3,4,5].map(n => <span key={n} className="text-sm">{n <= r.rating ? '⭐' : '☆'}</span>)}</div>
            </div>
            {r.comment && <p className="text-xs text-slate-500 dark:text-slate-400 italic">"{r.comment}"</p>}
            <p className="text-xs text-slate-400 mt-1">{new Date(r.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── ProfileTab — standalone so it never remounts ─────────────────────────────
function ProfileTab({ user, isProvider, appointments, confirmed, uniquePatients }) {
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [form, setForm]       = useState({
    firstName: user.firstName || '', lastName: user.lastName || '',
    phone: user.phone || '', bio: user.bio || '',
    specialty: user.specialty || '', experience: user.experience || '',
    responseTime: user.responseTime || '', fees: user.fees || '',
  })

  const handleSave = async () => {
    setSaving(true); setSaveMsg('')
    try {
      const res  = await fetch(`${API}/users/me`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to save')
      const stored = JSON.parse(localStorage.getItem('dh_user') || '{}')
      localStorage.setItem('dh_user', JSON.stringify({ ...stored, ...data }))
      setSaveMsg('✅ Profile updated!')
      setEditing(false)
      setTimeout(() => setSaveMsg(''), 3000)
    } catch (e) { setSaveMsg(`❌ ${e.message}`) }
    finally { setSaving(false) }
  }

  const Field = ({ label, field, placeholder, multiline }) => (
    <div>
      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">{label}</label>
      {editing ? (
        multiline
          ? <textarea value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} rows={3} placeholder={placeholder}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
          : <input value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} placeholder={placeholder}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      ) : (
        <p className="text-sm text-slate-800 dark:text-slate-100 font-medium">{form[field] || <span className="text-slate-400 italic">Not set</span>}</p>
      )}
    </div>
  )

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Profile</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your account information</p>
        </div>
        {!editing
          ? <button onClick={() => setEditing(true)} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition">✏️ Edit Profile</button>
          : <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition">{saving ? 'Saving...' : '✅ Save'}</button>
            </div>
        }
      </div>

      {saveMsg && <div className={`px-4 py-3 rounded-xl text-sm font-medium ${saveMsg.startsWith('✅') ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>{saveMsg}</div>}

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0 ${isProvider ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
            {user.firstName?.[0]}{user.lastName?.[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{user.firstName} {user.lastName}</h2>
            <p className={`capitalize font-medium text-sm ${isProvider ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>{user.role}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name" field="firstName" placeholder="First name" />
          <Field label="Last Name"  field="lastName"  placeholder="Last name" />
          <Field label="Phone"      field="phone"     placeholder="+1 234 567 8900" />
          {isProvider && <>
            <Field label="Specialty"        field="specialty"    placeholder="e.g. Cardiologist" />
            <Field label="Experience"       field="experience"   placeholder="e.g. 10 years" />
            <Field label="Response Time"    field="responseTime" placeholder="e.g. < 2 hours" />
            <Field label="Consultation Fee (UGX)" field="fees" placeholder="e.g. UGX 50,000 / session" />
          </>}
          <div className="sm:col-span-2">
            <Field label="Bio" field="bio" placeholder="Tell patients about yourself..." multiline />
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-3">
          <div className={`flex-1 text-center p-3 rounded-xl ${isProvider ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-indigo-50 dark:bg-indigo-900/20'}`}>
            <p className={`text-2xl font-bold ${isProvider ? 'text-emerald-700 dark:text-emerald-400' : 'text-indigo-700 dark:text-indigo-400'}`}>{appointments.length}</p>
            <p className={`text-xs font-medium mt-0.5 ${isProvider ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>{isProvider ? 'Total Requests' : 'Total Bookings'}</p>
          </div>
          <div className="flex-1 text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{confirmed.length}</p>
            <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-0.5">Confirmed</p>
          </div>
          {isProvider && (
            <div className="flex-1 text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{uniquePatients.length}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">Patients</p>
            </div>
          )}
        </div>
      </div>

      {isProvider && <ProviderReviewsList providerId={user.id} />}
    </div>
  )
}

// Nav items differ by role
function getNav(isProvider) {
  if (isProvider) return [
    { id: 'overview',         icon: '🏠', label: 'Overview'          },
    { id: 'requests',         icon: '📋', label: 'Requests'          },
    { id: 'schedule',         icon: '📅', label: 'My Schedule'       },
    { id: 'availability',     icon: '🗓️', label: 'Availability'      },
    { id: 'patients',         icon: '👥', label: 'Patients'          },
    { id: 'notes',            icon: '📝', label: 'Consultation Notes' },
    { id: 'prescriptions',    icon: '💊', label: 'Prescriptions'     },
    { id: 'chat',             icon: '💬', label: 'Messages'          },
    { id: 'provider-reviews', icon: '⭐', label: 'Reviews'           },
    { id: 'notifications',    icon: '🔔', label: 'Notifications'     },
    { id: 'profile',          icon: '👤', label: 'Profile'           },
  ]
  return [
    { id: 'overview',      icon: '🏠', label: 'Overview'       },
    { id: 'appointments',  icon: '📅', label: 'Appointments'   },
    { id: 'notes',         icon: '📝', label: 'My Notes'       },
    { id: 'prescriptions', icon: '💊', label: 'Prescriptions'  },
    { id: 'chat',          icon: '💬', label: 'Messages'       },
    { id: 'notifications', icon: '🔔', label: 'Notifications'  },
    { id: 'find-doctors',  icon: '🧑‍⚕️', label: 'Find Doctors'   },
    { id: 'reviews',       icon: '⭐', label: 'My Reviews'     },
    { id: 'profile',       icon: '👤', label: 'Profile'        },
  ]
}

export default function Dashboard() {
  const router = useRouter()
  const { dark, toggle: toggleTheme } = useTheme()
  const [user, setUser]                         = useState(null)
  const [tab, setTab]                           = useState('overview')
  const [sidebarOpen, setSidebarOpen]           = useState(false)
  const [appointments, setAppointments]         = useState([])
  const [notifications, setNotifications]       = useState([])
  const [providers, setProviders]               = useState([])
  const [availabilities, setAvailabilities]     = useState([])
  const [loadingApts, setLoadingApts]           = useState(true)
  const [loadingProviders, setLoadingProviders] = useState(false)
  const [loadingAvail, setLoadingAvail]         = useState(false)
  const [actionLoading, setActionLoading]       = useState({})
  const [cancellingId, setCancellingId]         = useState(null)
  const [aptFilter, setAptFilter]               = useState('all')
  const [searchQuery, setSearchQuery]           = useState('')
  const [aptsError, setAptsError]               = useState('')
  const [notifError, setNotifError]             = useState('')
  const [chatUnread, setChatUnread]             = useState(0)

  const isProvider = user ? PROVIDER_ROLES.includes(user.role) : false
  const NAV = getNav(isProvider)

  // ── fetchers ─────────────────────────────────────────────────────────────────
  const loadAppointments = useCallback(async () => {
    const token = getAuthToken()
    if (!token) return
    try {
      setLoadingApts(true); setAptsError('')
      const res = await fetch(`${API_BASE}/bookings`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      setAppointments(await res.json())
    } catch (e) { setAptsError(e.message) }
    finally { setLoadingApts(false) }
  }, [])

  const loadNotifications = useCallback(async () => {
    const token = getAuthToken()
    if (!token) return
    try {
      setNotifError('')
      setNotifications(await fetchNotifications(token))
    } catch (e) { setNotifError(e.message) }
  }, [])

  const loadProviders = useCallback(async () => {
    try { setLoadingProviders(true); setProviders(await fetchFeaturedDoctors_Combined()) }
    catch (_) {} finally { setLoadingProviders(false) }
  }, [])

  const loadAvailabilities = useCallback(async () => {
    const token = getAuthToken()
    if (!token) return
    try {
      setLoadingAvail(true)
      const res = await fetch(`${API_BASE}/providers/me/availabilities`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setAvailabilities(await res.json())
    } catch (_) {}
    finally { setLoadingAvail(false) }
  }, [])

  useEffect(() => {
    const u = getCurrentUser()
    if (!u) { router.replace('/login'); return }
    setUser(u)
    
    // Handle URL parameters for tab navigation
    if (router.query.tab) {
      setTab(router.query.tab)
    }
    
    loadAppointments()
    loadNotifications()
    if (u.role === 'patient') loadProviders()
    if (PROVIDER_ROLES.includes(u.role)) loadAvailabilities()
    const iv = setInterval(() => { loadNotifications(); loadAppointments() }, 30000)
    return () => clearInterval(iv)
  }, [router, loadAppointments, loadNotifications, loadProviders, loadAvailabilities])

  // ── actions ──────────────────────────────────────────────────────────────────
  const handleOpenNotifications = async () => {
    setTab('notifications')
    if (notifications.some(n => !n.read)) {
      await markAllNotificationsRead(getAuthToken())
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return
    setCancellingId(id)
    try {
      await cancelBooking(id, getAuthToken())
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a))
    } catch (e) { alert(e.message) }
    finally { setCancellingId(null) }
  }

  const handleApprove = async (id) => {
    setActionLoading(p => ({ ...p, [id]: 'approving' }))
    try {
      const res = await fetch(`${API_BASE}/bookings/${id}/approve`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${getAuthToken()}` }
      })
      if (!res.ok) throw new Error('Failed to approve')
      const updated = await res.json()
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'confirmed', meetingLink: updated.meetingLink } : a))
    } catch (e) { alert(e.message) }
    finally { setActionLoading(p => ({ ...p, [id]: null })) }
  }

  const handleReject = async (id) => {
    if (!window.confirm('Reject this appointment?')) return
    setActionLoading(p => ({ ...p, [id]: 'rejecting' }))
    try {
      const res = await fetch(`${API_BASE}/bookings/${id}/reject`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${getAuthToken()}` }
      })
      if (!res.ok) throw new Error('Failed to reject')
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' } : a))
    } catch (e) { alert(e.message) }
    finally { setActionLoading(p => ({ ...p, [id]: null })) }
  }

  // ── derived ───────────────────────────────────────────────────────────────────
  const unreadCount  = notifications.filter(n => !n.read).length
  const pending      = appointments.filter(a => a.status === 'pending')
  const confirmed    = appointments.filter(a => a.status === 'confirmed')
  const upcoming     = confirmed
    .filter(a => new Date(a.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0]
  const filteredApts = aptFilter === 'all' ? appointments : appointments.filter(a => a.status === aptFilter)
  const uniquePatients = [...new Map(appointments.map(a => [a.patient?.id, a.patient])).values()].filter(Boolean)
  const filteredProviders = providers.filter(p =>
    !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.specialty || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // ── shared sidebar ────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 w-64">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 dark:border-slate-700">
        <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">DH</div>
        <span className="font-bold text-slate-800 dark:text-white text-lg">DoctorsHub</span>
      </div>

      <div className={`mx-4 mt-4 mb-2 p-3 rounded-xl flex items-center gap-3 ${isProvider ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-indigo-50 dark:bg-indigo-900/30'}`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${isProvider ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
          {user.firstName?.[0]}{user.lastName?.[0]}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">
            {user.firstName} {user.lastName}
          </p>
          <p className={`text-xs capitalize font-medium ${isProvider ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
            {isProvider ? `Healthcare ${user.role}` : 'Patient'}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {NAV.map(item => (
          <button
            key={item.id}
            onClick={() => { setTab(item.id); setSidebarOpen(false); if (item.id === 'notifications') handleOpenNotifications() }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === item.id
                ? isProvider ? 'bg-emerald-600 text-white shadow-sm' : 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
            {item.id === 'notifications' && unreadCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
            {item.id === 'chat' && chatUnread > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 animate-pulse">
                {chatUnread > 99 ? '99+' : chatUnread}
              </span>
            )}
            {item.id === 'requests' && pending.length > 0 && (
              <span className="ml-auto bg-yellow-400 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                {pending.length}
              </span>
            )}
            {item.id === 'appointments' && pending.length > 0 && (
              <span className="ml-auto bg-yellow-400 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={() => { logout(); router.push('/login') }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  )

  // ── shared top bar ────────────────────────────────────────────────────────────
  const TopBar = () => (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-4 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Open menu">☰</button>
        <h2 className="font-semibold text-slate-700 dark:text-slate-200">{NAV.find(n => n.id === tab)?.label || 'Dashboard'}</h2>
      </div>
      <div className="flex items-center gap-3">
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          aria-label="Toggle dark mode"
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? '☀️' : '🌙'}
        </button>

        <button onClick={handleOpenNotifications} className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition" aria-label="Notifications">
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Chat unread indicator */}
        <button onClick={() => setTab('chat')} className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition" aria-label="Messages">
          <span className="text-xl">💬</span>
          {chatUnread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
              {chatUnread > 99 ? '99+' : chatUnread}
            </span>
          )}
        </button>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${isProvider ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
          {user.firstName?.[0]}{user.lastName?.[0]}
        </div>
      </div>
    </header>
  )

  // ── PATIENT: overview ─────────────────────────────────────────────────────────
  const PatientOverview = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Good {getGreeting()}, {user.firstName} 👋</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Here's your health activity at a glance.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings', value: appointments.length,                                   icon: '📋', color: 'bg-indigo-50 text-indigo-700' },
          { label: 'Pending',        value: pending.length,                                        icon: '⏳', color: 'bg-yellow-50 text-yellow-700' },
          { label: 'Confirmed',      value: confirmed.length,                                      icon: '✅', color: 'bg-green-50 text-green-700'  },
          { label: 'Unread',         value: unreadCount,                                           icon: '🔔', color: 'bg-red-50 text-red-600'      },
        ].map(c => (
          <div key={c.label} className={`rounded-2xl p-5 ${c.color} shadow-sm`}>
            <p className="text-2xl mb-1">{c.icon}</p>
            <p className="text-3xl font-bold">{c.value}</p>
            <p className="text-sm font-medium mt-1 opacity-80">{c.label}</p>
          </div>
        ))}
      </div>

      {upcoming ? (
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <p className="text-indigo-200 text-xs font-semibold tracking-widest mb-2">NEXT APPOINTMENT</p>
          <h2 className="text-xl font-bold">{upcoming.provider.firstName} {upcoming.provider.lastName}</h2>
          <p className="text-indigo-200 text-sm mb-4">{upcoming.provider.specialty || upcoming.provider.role}</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span>📅 {new Date(upcoming.startTime).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</span>
            <span>🕐 {new Date(upcoming.startTime).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})} – {new Date(upcoming.endTime).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}</span>
            <span>{upcoming.consultationType === 'video' ? '📹 Video' : '👨‍⚕️ Physical'}</span>
          </div>
          {upcoming.consultationType === 'video' && upcoming.meetingLink && (
            <button onClick={() => router.push(`/consultation/${upcoming.id}`)}
              className="mt-4 inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-5 py-2 rounded-xl hover:bg-indigo-50 transition text-sm">
              📹 Join Video Call
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
          <p className="text-4xl mb-2">📭</p>
          <p className="text-slate-600 font-medium">No upcoming appointments</p>
          <button onClick={() => setTab('find-doctors')} className="mt-3 px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
            Book an Appointment
          </button>
        </div>
      )}

      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Book Now',       icon: '➕', action: () => setTab('find-doctors')    },
            { label: 'Appointments',   icon: '📅', action: () => setTab('appointments')    },
            { label: 'Notifications',  icon: '🔔', action: handleOpenNotifications         },
            { label: 'My Profile',     icon: '👤', action: () => setTab('profile')         },
          ].map(q => (
            <button key={q.label} onClick={q.action}
              className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-400 hover:shadow-md transition text-sm font-medium text-slate-700">
              <span className="text-2xl">{q.icon}</span>{q.label}
            </button>
          ))}
        </div>
      </div>

      {aptsError ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-red-600 text-sm">⚠️ {aptsError}</p>
          <button onClick={loadAppointments} className="mt-2 text-xs text-red-700 underline">Retry</button>
        </div>
      ) : appointments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-700">Recent Appointments</h2>
            <button onClick={() => setTab('appointments')} className="text-sm text-indigo-600 hover:underline">View all</button>
          </div>
          <div className="space-y-3">
            {appointments.slice(0, 3).map(a => <PatientAptCard key={a.id} apt={a} compact />)}
          </div>
        </div>
      )}
    </div>
  )

  // ── PROVIDER: overview ────────────────────────────────────────────────────────
  const ProviderOverview = () => {
    const todayApts = appointments.filter(a => {
      const d = new Date(a.startTime)
      const now = new Date()
      return d.toDateString() === now.toDateString()
    })
    const nextPending = pending.sort((a,b) => new Date(a.startTime) - new Date(b.startTime))[0]

    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Good {getGreeting()}, {user.firstName} 👋</h1>
            <p className="text-slate-500 mt-1 capitalize">{user.specialty || user.role} · DoctorsHub Provider</p>
          </div>
          <span className="hidden sm:flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Active
          </span>
        </div>

        {/* stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Patients',  value: uniquePatients.length,  icon: '👥', color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'    },
            { label: 'Pending',         value: pending.length,         icon: '⏳', color: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
            { label: 'Confirmed',       value: confirmed.length,       icon: '✅', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'},
            { label: 'Today',           value: todayApts.length,       icon: '📅', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
          ].map(c => (
            <div key={c.label} className={`rounded-2xl p-5 ${c.color} shadow-sm`}>
              <p className="text-2xl mb-1">{c.icon}</p>
              <p className="text-3xl font-bold">{c.value}</p>
              <p className="text-sm font-medium mt-1 opacity-80">{c.label}</p>
            </div>
          ))}
        </div>

        {/* urgent: next pending request */}
        {nextPending ? (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
            <p className="text-amber-100 text-xs font-semibold tracking-widest mb-2">⚡ ACTION NEEDED</p>
            <h2 className="text-xl font-bold">{nextPending.patient.firstName} {nextPending.patient.lastName}</h2>
            <p className="text-amber-100 text-sm mb-1">Requested an appointment</p>
            <div className="flex flex-wrap gap-4 text-sm mt-3">
              <span>📅 {new Date(nextPending.startTime).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</span>
              <span>🕐 {new Date(nextPending.startTime).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})} – {new Date(nextPending.endTime).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}</span>
              <span>{nextPending.consultationType === 'video' ? '📹 Video' : '👨‍⚕️ Physical'}</span>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => handleApprove(nextPending.id)} disabled={actionLoading[nextPending.id] === 'approving'}
                className="px-5 py-2 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition text-sm disabled:opacity-50">
                {actionLoading[nextPending.id] === 'approving' ? '⏳ Approving...' : '✅ Approve'}
              </button>
              <button onClick={() => handleReject(nextPending.id)} disabled={actionLoading[nextPending.id] === 'rejecting'}
                className="px-5 py-2 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition text-sm disabled:opacity-50">
                {actionLoading[nextPending.id] === 'rejecting' ? '⏳...' : '❌ Reject'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-2xl p-5 flex items-center gap-4">
            <span className="text-3xl">🎉</span>
            <div>
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">All caught up!</p>
              <p className="text-emerald-600 dark:text-emerald-400 text-sm">No pending appointment requests right now.</p>
            </div>
          </div>
        )}

        {/* quick actions */}
        <div>
          <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'View Requests',  icon: '📋', action: () => setTab('requests')       },
              { label: 'My Schedule',    icon: '📅', action: () => setTab('schedule')       },
              { label: 'Patients',       icon: '👥', action: () => setTab('patients')       },
              { label: 'Notifications',  icon: '🔔', action: handleOpenNotifications        },
            ].map(q => (
              <button key={q.label} onClick={q.action}
                className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-emerald-400 hover:shadow-md transition text-sm font-medium text-slate-700 dark:text-slate-200">
                <span className="text-2xl">{q.icon}</span>{q.label}
              </button>
            ))}
          </div>
        </div>

        {/* today's schedule */}
        {todayApts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Today's Schedule</h2>
              <button onClick={() => setTab('schedule')} className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">View all</button>
            </div>
            <div className="space-y-3">
              {todayApts.map(a => <ProviderAptCard key={a.id} apt={a} compact />)}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── PATIENT appointment card ──────────────────────────────────────────────────
  const PatientAptCard = ({ apt, compact = false }) => (
    <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:shadow-md transition ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm flex-shrink-0">
            {apt.provider?.firstName?.[0]}{apt.provider?.lastName?.[0]}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 dark:text-white truncate">{apt.provider?.firstName} {apt.provider?.lastName}</p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400">{apt.provider?.specialty || apt.provider?.role}</p>
          </div>
        </div>
        <Badge status={apt.status} />
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span>📅 {new Date(apt.startTime).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
        <span>🕐 {new Date(apt.startTime).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})} – {new Date(apt.endTime).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}</span>
        <span>{apt.consultationType === 'video' ? '📹 Video' : '👨‍⚕️ Physical'}</span>
      </div>
      {!compact && (
        <div className="mt-4 flex flex-wrap gap-2">
          {apt.status === 'confirmed' && apt.consultationType === 'video' && apt.meetingLink && (
            <button onClick={() => router.push(`/consultation/${apt.id}`)}
              className="px-4 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition">
              📹 Join Call
            </button>
          )}
          {(apt.status === 'pending' || apt.status === 'confirmed') && (
            <button onClick={() => handleCancel(apt.id)} disabled={cancellingId === apt.id}
              className="px-4 py-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-semibold rounded-lg hover:bg-red-100 transition disabled:opacity-50">
              {cancellingId === apt.id ? 'Cancelling...' : 'Cancel'}
            </button>
          )}
          {apt.status === 'rejected' && (
            <button onClick={() => setTab('find-doctors')}
              className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition">
              Book Another
            </button>
          )}
        </div>
      )}
    </div>
  )

  // ── PROVIDER appointment card ─────────────────────────────────────────────────
  const ProviderAptCard = ({ apt, compact = false }) => (
    <div className={`bg-white border border-slate-200 rounded-2xl hover:shadow-md transition ${compact ? 'p-4' : 'p-5'} border-l-4 ${
      apt.status === 'pending' ? 'border-l-yellow-400' : apt.status === 'confirmed' ? 'border-l-emerald-500' : 'border-l-slate-300'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
            {apt.patient?.firstName?.[0]}{apt.patient?.lastName?.[0]}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 truncate">{apt.patient?.firstName} {apt.patient?.lastName}</p>
            <p className="text-xs text-slate-500">Patient</p>
          </div>
        </div>
        <Badge status={apt.status} />
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
        <span>📅 {new Date(apt.startTime).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
        <span>🕐 {new Date(apt.startTime).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})} – {new Date(apt.endTime).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}</span>
        <span>{apt.consultationType === 'video' ? '📹 Video' : '👨‍⚕️ Physical'}</span>
      </div>
      {apt.notes && !compact && (
        <p className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">📝 {apt.notes}</p>
      )}
      {!compact && apt.status === 'pending' && (
        <div className="mt-4 flex gap-2">
          <button onClick={() => handleApprove(apt.id)} disabled={actionLoading[apt.id] === 'approving'}
            className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50">
            {actionLoading[apt.id] === 'approving' ? '⏳...' : '✅ Approve'}
          </button>
          <button onClick={() => handleReject(apt.id)} disabled={actionLoading[apt.id] === 'rejecting'}
            className="px-4 py-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-semibold rounded-lg hover:bg-red-100 transition disabled:opacity-50">
            {actionLoading[apt.id] === 'rejecting' ? '⏳...' : '❌ Reject'}
          </button>
        </div>
      )}
      {!compact && apt.status === 'confirmed' && apt.consultationType === 'video' && apt.meetingLink && (
        <button onClick={() => router.push(`/consultation/${apt.id}`)}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition">
          📹 Join Call
        </button>
      )}
    </div>
  )

  // ── PROVIDER: requests tab ────────────────────────────────────────────────────
  const RequestsTab = () => (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Appointment Requests</h1>
        <p className="text-slate-500 mt-1">Review and respond to patient bookings</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'All',       value: appointments.length,  filter: 'all',       cls: 'bg-slate-50 text-slate-700'    },
          { label: 'Pending',   value: pending.length,       filter: 'pending',   cls: 'bg-yellow-50 text-yellow-700'  },
          { label: 'Confirmed', value: confirmed.length,     filter: 'confirmed', cls: 'bg-emerald-50 text-emerald-700'},
          { label: 'Rejected',  value: appointments.filter(a=>a.status==='rejected').length, filter: 'rejected', cls: 'bg-red-50 text-red-700' },
        ].map(s => (
          <button key={s.filter} onClick={() => setAptFilter(s.filter)}
            className={`rounded-2xl p-4 text-left border-2 transition ${s.cls} ${aptFilter === s.filter ? 'border-emerald-400 shadow-sm' : 'border-transparent'}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm font-medium mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>
      {loadingApts ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
      ) : aptsError ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-medium mb-3">⚠️ {aptsError}</p>
          <button onClick={loadAppointments} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition">Retry</button>
        </div>
      ) : filteredApts.length > 0 ? (
        <div className="space-y-3">{filteredApts.map(a => <ProviderAptCard key={a.id} apt={a} />)}</div>
      ) : (
        <div className="text-center py-16 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-slate-600 dark:text-slate-300 font-medium">No appointments in this category</p>
        </div>
      )}
    </div>
  )

  // ── PROVIDER: schedule tab ────────────────────────────────────────────────────
  const ScheduleTab = () => {
    const upcoming7 = appointments
      .filter(a => a.status === 'confirmed' && new Date(a.startTime) > new Date())
      .sort((a,b) => new Date(a.startTime) - new Date(b.startTime))

    // Group by date
    const grouped = upcoming7.reduce((acc, a) => {
      const key = new Date(a.startTime).toDateString()
      if (!acc[key]) acc[key] = []
      acc[key].push(a)
      return acc
    }, {})

    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Schedule</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Upcoming confirmed appointments</p>
        </div>
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-slate-600 dark:text-slate-300 font-medium">No upcoming appointments scheduled</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, apts]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {new Date(date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}
                </div>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                <span className="text-xs text-slate-400">{apts.length} appointment{apts.length > 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-3">
                {apts.map(a => (
                  <div key={a.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-4">
                    <div className="text-center bg-emerald-50 dark:bg-emerald-900/30 rounded-xl px-3 py-2 flex-shrink-0">
                      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                        {new Date(a.startTime).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}
                      </p>
                      <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-0.5">
                        – {new Date(a.endTime).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-white">{a.patient?.firstName} {a.patient?.lastName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{a.consultationType === 'video' ? '📹 Video Consultation' : '👨‍⚕️ Physical Visit'}</p>
                      {a.notes && <p className="text-xs text-slate-400 mt-1 truncate">📝 {a.notes}</p>}
                    </div>
                    {a.consultationType === 'video' && a.meetingLink && (
                      <button onClick={() => router.push(`/consultation/${a.id}`)}
                        className="flex-shrink-0 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition">
                        Join
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    )
  }

  // ── PROVIDER: patients tab ────────────────────────────────────────────────────
  const PatientsTab = () => (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Patients</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{uniquePatients.length} patient{uniquePatients.length !== 1 ? 's' : ''} have booked with you</p>
      </div>
      {uniquePatients.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-slate-600 dark:text-slate-300 font-medium">No patients yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {uniquePatients.map(p => {
            const patientApts = appointments.filter(a => a.patient?.id === p.id)
            const lastApt = patientApts.sort((a,b) => new Date(b.startTime) - new Date(a.startTime))[0]
            return (
              <div key={p.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:shadow-md transition">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold flex-shrink-0">
                    {p.firstName?.[0]}{p.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{p.firstName} {p.lastName}</p>
                    <p className="text-xs text-slate-500">Patient</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span>📧</span>
                    <a href={`mailto:${p.email}`} className="text-indigo-600 hover:underline truncate">{p.email}</a>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <span>📱</span>
                    <a href={`tel:${p.phone}`} className="text-indigo-600 hover:underline">{p.phone}</a>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{patientApts.length} appointment{patientApts.length !== 1 ? 's' : ''}</span>
                  {lastApt && <span>Last: {new Date(lastApt.startTime).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  // ── PATIENT: appointments tab ─────────────────────────────────────────────────
  const PatientAppointmentsTab = () => (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Appointments</h1>
        <p className="text-slate-500 mt-1">Track and manage all your bookings</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'All',       value: appointments.length,  filter: 'all',       cls: 'bg-slate-50 text-slate-700'   },
          { label: 'Pending',   value: pending.length,       filter: 'pending',   cls: 'bg-yellow-50 text-yellow-700' },
          { label: 'Confirmed', value: confirmed.length,     filter: 'confirmed', cls: 'bg-green-50 text-green-700'   },
          { label: 'Rejected',  value: appointments.filter(a=>a.status==='rejected').length, filter: 'rejected', cls: 'bg-red-50 text-red-700' },
        ].map(s => (
          <button key={s.filter} onClick={() => setAptFilter(s.filter)}
            className={`rounded-2xl p-4 text-left border-2 transition ${s.cls} ${aptFilter === s.filter ? 'border-indigo-400 shadow-sm' : 'border-transparent'}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm font-medium mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>
      {loadingApts ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
      ) : aptsError ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-medium mb-3">⚠️ {aptsError}</p>
          <button onClick={loadAppointments} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition">Retry</button>
        </div>
      ) : filteredApts.length > 0 ? (
        <div className="space-y-3">{filteredApts.map(a => <PatientAptCard key={a.id} apt={a} />)}</div>
      ) : (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-slate-600 font-medium">No appointments here</p>
          <button onClick={() => setTab('find-doctors')} className="mt-3 px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">Book Now</button>
        </div>
      )}
    </div>
  )

  // ── shared: notifications tab ─────────────────────────────────────────────────
  const NotificationsTab = () => (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
        <p className="text-slate-500 mt-1">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
      </div>
      {notifError ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-medium mb-3">⚠️ {notifError}</p>
          <button onClick={loadNotifications} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition">Retry</button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-slate-600 font-medium">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id} className={`flex gap-3 p-4 rounded-2xl border-l-4 ${typeColor[n.type] || typeColor.general} ${n.read ? 'opacity-60' : ''}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 font-medium">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.read && <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ── PATIENT: find doctors tab ─────────────────────────────────────────────────
  const FindDoctorsTab = () => (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Find Doctors</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Browse and book verified healthcare professionals</p>
      </div>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <input type="text" placeholder="Search by name or specialty..." value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      </div>
      {loadingProviders ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-slate-100 dark:bg-slate-700 rounded-2xl animate-pulse" />)}
        </div>
      ) : filteredProviders.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProviders.map(p => (
            <div key={p.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden hover:shadow-lg transition group">
              <div className="relative h-40 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/50 dark:to-blue-900/50">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-full px-2.5 py-1 flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow">
                  ⭐ {p.rating}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-slate-800 dark:text-white">{p.name}</h3>
                <p className="text-indigo-600 dark:text-indigo-400 text-sm font-medium mt-0.5">{p.specialty}</p>
                <div className="flex gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>🏅 {p.experience}</span>
                  <span>⚡ {p.responseTime}</span>
                </div>
                {p.fees && (
                  <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">💰 {p.fees}</p>
                )}
                <button onClick={() => { localStorage.setItem('selectedProvider', JSON.stringify(p)); router.push(`/book-appointment/${p.id}`) }}
                  className="mt-4 w-full py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition">
                  Book Appointment
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-slate-600 dark:text-slate-300 font-medium">No providers found</p>
        </div>
      )}
    </div>
  )

  // ── PROVIDER: availability tab ────────────────────────────────────────────────
  const AvailabilityTab = () => {
    const today = new Date()
    today.setHours(0,0,0,0)

    // Calendar state
    const [calYear, setCalYear]   = useState(today.getFullYear())
    const [calMonth, setCalMonth] = useState(today.getMonth())
    const [selectedDate, setSelectedDate] = useState(null)
    const [newStart, setNewStart] = useState('')
    const [newEnd, setNewEnd]     = useState('')
    const [adding, setAdding]     = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const [addError, setAddError] = useState('')

    // Build calendar grid
    const firstDay = new Date(calYear, calMonth, 1).getDay()
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
    const cells = Array(firstDay).fill(null).concat(
      Array.from({ length: daysInMonth }, (_, i) => i + 1)
    )

    // Which days have slots
    const daysWithSlots = new Set(
      availabilities.map(a => {
        const d = new Date(a.startTime)
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      })
    )

    const hasSlot = (day) => {
      if (!day) return false
      return daysWithSlots.has(`${calYear}-${calMonth}-${day}`)
    }

    const isToday = (day) => {
      const t = new Date()
      return day === t.getDate() && calMonth === t.getMonth() && calYear === t.getFullYear()
    }

    const isPast = (day) => {
      const d = new Date(calYear, calMonth, day)
      return d < today
    }

    // Slots for selected date
    const selectedSlots = selectedDate
      ? availabilities.filter(a => {
          const d = new Date(a.startTime)
          return d.getDate() === selectedDate &&
                 d.getMonth() === calMonth &&
                 d.getFullYear() === calYear
        }).sort((a,b) => new Date(a.startTime) - new Date(b.startTime))
      : []

    const handleAddSlot = async () => {
      if (!newStart || !newEnd) { setAddError('Please set both start and end time'); return }
      if (newEnd <= newStart) { setAddError('End time must be after start time'); return }
      setAddError('')
      setAdding(true)
      try {
        const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(selectedDate).padStart(2,'0')}`
        const startTime = new Date(`${dateStr}T${newStart}:00`).toISOString()
        const endTime   = new Date(`${dateStr}T${newEnd}:00`).toISOString()
        const res = await fetch(`${API_BASE}/providers/me/availabilities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
          body: JSON.stringify({ startTime, endTime }),
        })
        if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed to add slot') }
        const saved = await res.json()
        setAvailabilities(prev => [...prev, saved])
        setNewStart(''); setNewEnd('')
      } catch (e) { setAddError(e.message) }
      finally { setAdding(false) }
    }

    const handleDeleteSlot = async (id) => {
      setDeletingId(id)
      try {
        const res = await fetch(`${API_BASE}/providers/me/availabilities/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        })
        if (!res.ok) throw new Error('Failed to delete')
        setAvailabilities(prev => prev.filter(a => a.id !== id))
      } catch (e) { alert(e.message) }
      finally { setDeletingId(null) }
    }

    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
    const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Availability</h1>
          <p className="text-slate-500 mt-1">Set the dates and times you're available for appointments. Patients can only book your open slots.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── Calendar ── */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-5">
            {/* month nav */}
            <div className="flex items-center justify-between mb-5">
              <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y=>y-1) } else setCalMonth(m=>m-1) }}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600 transition">‹</button>
              <h2 className="font-bold text-slate-800">{MONTHS[calMonth]} {calYear}</h2>
              <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y=>y+1) } else setCalMonth(m=>m+1) }}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600 transition">›</button>
            </div>

            {/* day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>
              ))}
            </div>

            {/* cells */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (!day) return <div key={i} />
                const past = isPast(day)
                const selected = selectedDate === day
                const hasS = hasSlot(day)
                return (
                  <button
                    key={i}
                    onClick={() => !past && setSelectedDate(day === selectedDate ? null : day)}
                    disabled={past}
                    className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all
                      ${past ? 'text-slate-300 cursor-not-allowed' : 'cursor-pointer hover:bg-indigo-50'}
                      ${selected ? 'bg-emerald-600 text-white hover:bg-emerald-700' : ''}
                      ${isToday(day) && !selected ? 'ring-2 ring-emerald-400 text-emerald-700' : ''}
                      ${!selected && !past ? 'text-slate-700' : ''}
                    `}
                  >
                    {day}
                    {hasS && (
                      <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${selected ? 'bg-white' : 'bg-emerald-500'}`} />
                    )}
                  </button>
                )
              })}
            </div>

            {/* legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Has slots</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full ring-2 ring-emerald-400" /> Today</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-600" /> Selected</span>
            </div>
          </div>

          {/* ── Slot panel ── */}
          <div className="lg:col-span-2 space-y-4">
            {selectedDate ? (
              <>
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <h3 className="font-bold text-slate-800 mb-1">
                    {new Date(calYear, calMonth, selectedDate).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">{selectedSlots.length} slot{selectedSlots.length !== 1 ? 's' : ''} added</p>

                  {/* existing slots */}
                  {selectedSlots.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {selectedSlots.map(s => (
                        <div key={s.id} className={`flex items-center justify-between p-3 rounded-xl border ${s.isBooked ? 'bg-yellow-50 border-yellow-200' : 'bg-emerald-50 border-emerald-200'}`}>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {new Date(s.startTime).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}
                              {' – '}
                              {new Date(s.endTime).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}
                            </p>
                            <p className={`text-xs mt-0.5 font-medium ${s.isBooked ? 'text-yellow-700' : 'text-emerald-600'}`}>
                              {s.isBooked ? '🔒 Booked' : '✅ Available'}
                            </p>
                          </div>
                          {!s.isBooked && (
                            <button onClick={() => handleDeleteSlot(s.id)} disabled={deletingId === s.id}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-40">
                              {deletingId === s.id ? '⏳' : '✕'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 mb-4">No slots yet for this day.</p>
                  )}

                  {/* add new slot */}
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Add New Slot</p>
                    <div className="flex gap-2 mb-2">
                      <div className="flex-1">
                        <label className="text-xs text-slate-500 mb-1 block">Start</label>
                        <input type="time" value={newStart} onChange={e => setNewStart(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-slate-500 mb-1 block">End</label>
                        <input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                      </div>
                    </div>
                    {addError && <p className="text-xs text-red-500 mb-2">{addError}</p>}
                    <button onClick={handleAddSlot} disabled={adding}
                      className="w-full py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition disabled:opacity-50">
                      {adding ? 'Adding...' : '+ Add Slot'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center">
                <p className="text-3xl mb-3">📅</p>
                <p className="font-semibold text-slate-700">Select a date</p>
                <p className="text-sm text-slate-500 mt-1">Click any future date on the calendar to manage its availability slots</p>
              </div>
            )}

            {/* summary */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Summary</p>
              <div className="space-y-2">
                {[
                  { label: 'Total slots',     value: availabilities.length,                        color: 'text-slate-700' },
                  { label: 'Available',        value: availabilities.filter(a=>!a.isBooked).length, color: 'text-emerald-600' },
                  { label: 'Booked',           value: availabilities.filter(a=>a.isBooked).length,  color: 'text-yellow-600' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{s.label}</span>
                    <span className={`font-bold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── PATIENT: reviews tab ─────────────────────────────────────────────────────
  const ReviewsTab = () => {
    const [reviewedIds, setReviewedIds]   = useState({})   // bookingId → review obj
    const [modal, setModal]               = useState(null) // booking being reviewed
    const [stars, setStars]               = useState(0)
    const [hoverStar, setHoverStar]       = useState(0)
    const [comment, setComment]           = useState('')
    const [submitting, setSubmitting]     = useState(false)
    const [submitMsg, setSubmitMsg]       = useState('')
    const [loadingReviews, setLoadingReviews] = useState(true)

    // Confirmed appointments only
    const reviewable = appointments.filter(a => a.status === 'confirmed')

    // Load existing reviews for all confirmed bookings
    useEffect(() => {
      if (reviewable.length === 0) { setLoadingReviews(false); return }
      const token = getAuthToken()
      if (!token) { setLoadingReviews(false); return }
      Promise.all(
        reviewable.map(a =>
          fetch(`${API_BASE}/reviews/booking/${a.id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(async r => {
              if (!r.ok) return null
              const text = await r.text()
              if (!text || text === 'null') return null
              try {
                const json = JSON.parse(text)
                const review = json?.review || null
                return review ? [a.id, review] : null
              } catch { return null }
            })
            .catch(() => null)
        )
      ).then(results => {
        const map = {}
        results.filter(Boolean).forEach(([id, review]) => { map[id] = review })
        setReviewedIds(map)
        setLoadingReviews(false)
      })
    }, [appointments.length])

    const openModal = (apt) => {
      setModal(apt)
      setStars(0); setHoverStar(0); setComment(''); setSubmitMsg('')
    }

    const handleSubmit = async () => {
      if (stars === 0) { setSubmitMsg('Please select a star rating'); return }
      setSubmitting(true); setSubmitMsg('')
      try {
        const res = await fetch(`${API_BASE}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
          body: JSON.stringify({ bookingId: modal.id, rating: stars, comment: comment || undefined }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Failed to submit review')
        setReviewedIds(prev => ({ ...prev, [modal.id]: data }))
        setSubmitMsg('success')
        setTimeout(() => setModal(null), 1500)
      } catch (e) {
        setSubmitMsg(e.message)
      } finally { setSubmitting(false) }
    }

    const StarRow = ({ value, hover, onHover, onLeave, onClick, size = 'text-2xl' }) => (
      <div className="flex gap-1" onMouseLeave={onLeave}>
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button"
            onMouseEnter={() => onHover(n)}
            onClick={() => onClick(n)}
            className={`${size} transition-transform hover:scale-110 focus:outline-none`}
            aria-label={`${n} star`}
          >
            {n <= (hover || value) ? '⭐' : '☆'}
          </button>
        ))}
      </div>
    )

    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Reviews</h1>
          <p className="text-slate-500 mt-1">Rate and review providers after confirmed appointments</p>
        </div>

        {loadingReviews ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
        ) : reviewable.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
            <p className="text-4xl mb-3">⭐</p>
            <p className="text-slate-600 font-medium">No confirmed appointments to review yet</p>
            <button onClick={() => setTab('find-doctors')} className="mt-3 px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
              Book an Appointment
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {reviewable.map(apt => {
              const reviewed = reviewedIds[apt.id]
              return (
                <div key={apt.id} className="bg-white border border-slate-200 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold flex-shrink-0">
                        {apt.provider?.firstName?.[0]}{apt.provider?.lastName?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800">{apt.provider?.firstName} {apt.provider?.lastName}</p>
                        <p className="text-xs text-indigo-600">{apt.provider?.specialty || apt.provider?.role}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(apt.startTime).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                          {' · '}
                          {new Date(apt.startTime).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}
                          {' – '}
                          {new Date(apt.endTime).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}
                        </p>
                      </div>
                    </div>

                    {reviewed ? (
                      <div className="text-right flex-shrink-0">
                        <div className="flex gap-0.5 justify-end mb-1">
                          {[1,2,3,4,5].map(n => (
                            <span key={n} className="text-lg">{n <= reviewed.rating ? '⭐' : '☆'}</span>
                          ))}
                        </div>
                        {reviewed.comment && (
                          <p className="text-xs text-slate-500 max-w-[180px] text-right italic">"{reviewed.comment}"</p>
                        )}
                        <p className="text-xs text-emerald-600 font-semibold mt-1">✓ Reviewed</p>
                      </div>
                    ) : (
                      <button onClick={() => openModal(apt)}
                        className="flex-shrink-0 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition">
                        Leave Review
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Review modal ── */}
        {modal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              {/* header */}
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">Rate Your Experience</h2>
                  <button onClick={() => setModal(null)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 transition text-white">✕</button>
                </div>
                <p className="text-indigo-200 text-sm mt-1">
                  {modal.provider?.firstName} {modal.provider?.lastName} · {modal.provider?.specialty || modal.provider?.role}
                </p>
              </div>

              <div className="p-6 space-y-5">
                {submitMsg === 'success' ? (
                  <div className="text-center py-6">
                    <p className="text-4xl mb-3">🎉</p>
                    <p className="font-semibold text-slate-800">Review submitted!</p>
                    <p className="text-sm text-slate-500 mt-1">Thank you for your feedback</p>
                  </div>
                ) : (
                  <>
                    {/* star picker */}
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-700 mb-3">How would you rate this provider?</p>
                      <StarRow
                        value={stars} hover={hoverStar}
                        onHover={setHoverStar} onLeave={() => setHoverStar(0)}
                        onClick={setStars} size="text-3xl"
                      />
                      <p className="text-xs text-slate-400 mt-2">
                        {['','Poor','Fair','Good','Very Good','Excellent'][hoverStar || stars] || 'Tap to rate'}
                      </p>
                    </div>

                    {/* comment */}
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-2 block">Your Review (Optional)</label>
                      <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Share your experience with this provider..."
                        rows={4}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                      />
                    </div>

                    {submitMsg && submitMsg !== 'success' && (
                      <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">{submitMsg}</p>
                    )}

                    <div className="flex gap-3">
                      <button onClick={() => setModal(null)}
                        className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition">
                        Cancel
                      </button>
                      <button onClick={handleSubmit} disabled={submitting || stars === 0}
                        className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition">
                        {submitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── PROVIDER: reviews tab ─────────────────────────────────────────────────────
  const ProviderReviewsTab = () => {
    const [reviews, setReviews]   = useState([])
    const [loading, setLoading]   = useState(true)
    const [error, setError]       = useState('')
    const [filter, setFilter]     = useState(0) // 0 = all, 1-5 = star filter

    useEffect(() => {
      if (!user) return
      fetch(`${API_BASE}/reviews/provider/${user.id}`)
        .then(r => { if (!r.ok) throw new Error('Failed to load'); return r.json() })
        .then(data => { setReviews(data); setLoading(false) })
        .catch(e => { setError(e.message); setLoading(false) })
    }, [user?.id])

    const filtered = filter === 0 ? reviews : reviews.filter(r => r.rating === filter)
    const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null
    const counts = [5,4,3,2,1].map(n => ({ star: n, count: reviews.filter(r => r.rating === n).length }))

    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Patient Reviews</h1>
          <p className="text-slate-500 mt-1">See what your patients are saying about you</p>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
            <p className="text-red-600 text-sm">⚠️ {error}</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
            <p className="text-4xl mb-3">⭐</p>
            <p className="text-slate-600 font-medium">No reviews yet</p>
            <p className="text-slate-400 text-sm mt-1">Reviews will appear here after patients rate their appointments</p>
          </div>
        ) : (
          <>
            {/* summary card */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-5xl font-bold">{avg}</p>
                  <div className="flex gap-0.5 justify-center mt-1">
                    {[1,2,3,4,5].map(n => (
                      <span key={n} className="text-lg">{n <= Math.round(avg) ? '⭐' : '☆'}</span>
                    ))}
                  </div>
                  <p className="text-emerald-100 text-xs mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {counts.map(({ star, count }) => (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="text-emerald-100 w-4 text-right">{star}</span>
                      <span className="text-xs">⭐</span>
                      <div className="flex-1 bg-white/20 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-white h-2 rounded-full transition-all"
                          style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className="text-emerald-100 text-xs w-4">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* star filter */}
            <div className="flex gap-2 flex-wrap">
              {[0,5,4,3,2,1].map(n => (
                <button key={n} onClick={() => setFilter(n)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${
                    filter === n ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-400'
                  }`}>
                  {n === 0 ? 'All' : `${'⭐'.repeat(n)} ${n} star${n !== 1 ? 's' : ''}`}
                </button>
              ))}
            </div>

            {/* review cards */}
            {filtered.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No reviews with this rating</p>
            ) : (
              <div className="space-y-3">
                {filtered.map(r => (
                  <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition">
                    <div className="flex items-start justify-between gap-3">
                      {/* patient info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                          {r.patient?.firstName?.[0]}{r.patient?.lastName?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800">
                            {r.patient?.firstName} {r.patient?.lastName}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(r.createdAt).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'})}
                          </p>
                        </div>
                      </div>
                      {/* stars */}
                      <div className="flex gap-0.5 flex-shrink-0">
                        {[1,2,3,4,5].map(n => (
                          <span key={n} className="text-lg">{n <= r.rating ? '⭐' : '☆'}</span>
                        ))}
                      </div>
                    </div>

                    {/* comment */}
                    {r.comment ? (
                      <div className="mt-3 bg-slate-50 rounded-xl px-4 py-3">
                        <p className="text-sm text-slate-700 italic">"{r.comment}"</p>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-slate-400 italic">No written comment</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  // ── tab router ────────────────────────────────────────────────────────────────
  const tabContent = {
    overview:         isProvider ? <ProviderOverview /> : <PatientOverview />,
    appointments:     <PatientAppointmentsTab />,
    requests:         <RequestsTab />,
    schedule:         <ScheduleTab />,
    availability:     <AvailabilityTab />,
    patients:         <PatientsTab />,
    notes:            <ConsultationNotesTab isProvider={isProvider} appointments={appointments} />,
    prescriptions:    <PrescriptionsTab isProvider={isProvider} appointments={appointments} />,
    chat:             <ChatTab userId={user.id} isProvider={isProvider} appointments={appointments} onUnreadChange={setChatUnread} />,
    'provider-reviews': <ProviderReviewsTab />,
    notifications:    <NotificationsTab />,
    'find-doctors':   <FindDoctorsTab />,
    reviews:          <ReviewsTab />,
    profile:          <ProfileTab user={user} isProvider={isProvider} appointments={appointments} confirmed={confirmed} uniquePatients={uniquePatients} />,
  }

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 overflow-hidden">
      <div className="hidden md:flex flex-col h-full flex-shrink-0"><Sidebar /></div>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="flex flex-col h-full flex-shrink-0"><Sidebar /></div>
          <div className="flex-1 bg-black/40" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            {tabContent[tab] || (isProvider ? <ProviderOverview /> : <PatientOverview />)}
          </div>
        </main>
      </div>
    </div>
  )
}

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

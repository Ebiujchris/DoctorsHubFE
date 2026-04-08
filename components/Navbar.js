import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState, useCallback } from 'react'
import { getCurrentUser, logout, getAuthToken } from '../services/auth'
import { fetchUnreadCount } from '../services/api'

export default function Navbar() {
  const router = useRouter()
  const isHome = router.pathname === '/'
  const [user, setUser] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  const refreshUnread = useCallback(async () => {
    const token = getAuthToken()
    if (!token) return
    try {
      const { count } = await fetchUnreadCount(token)
      setUnread(count)
    } catch (_) {}
  }, [])

  useEffect(() => {
    const u = getCurrentUser()
    setUser(u)
    if (u) {
      refreshUnread()
      const interval = setInterval(refreshUnread, 30000)
      return () => clearInterval(interval)
    }
  }, [refreshUnread])

  const handleNavClick = (e, hash) => {
    setMobileMenuOpen(false)
    if (isHome) {
      e.preventDefault()
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      e.preventDefault()
      router.push(`/${hash}`)
    }
  }

  return (
    <nav className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between bg-white/80 backdrop-blur sticky top-0 z-40 shadow-sm">
      <Link href="/" className="flex items-center gap-3 cursor-pointer">
        <div className="h-10 w-10 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">DH</div>
        <div className="font-semibold text-lg">DoctorsHub</div>
      </Link>

      <div className="hidden md:flex items-center gap-6 text-slate-700">
        <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="cursor-pointer hover:text-indigo-600">Home</a>
        <a href="#about" onClick={(e) => handleNavClick(e, '#about')} className="cursor-pointer hover:text-indigo-600">About Us</a>
        <a href="#services" onClick={(e) => handleNavClick(e, '#services')} className="cursor-pointer hover:text-indigo-600">Services</a>
        <a href="#contact" onClick={(e) => handleNavClick(e, '#contact')} className="cursor-pointer hover:text-indigo-600">Contact</a>
      </div>

      <button
        onClick={() => setMobileMenuOpen((prev) => !prev)}
        className="flex md:hidden items-center justify-center p-2 rounded border border-slate-200 text-slate-700 hover:bg-slate-100"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? '✕' : '☰'}
      </button>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            {/* Notification bell */}
            <Link href="/dashboard" className="relative p-2 text-slate-600 hover:text-indigo-600" aria-label="Notifications">
              <span className="text-xl">🔔</span>
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Link>
            <Link href="/dashboard" className="text-sm px-3 py-1 rounded hover:bg-slate-100">Dashboard</Link>
            <button
              onClick={() => { logout(); router.push('/login') }}
              className="text-sm px-3 py-1 rounded border text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/register" className="text-sm px-3 py-1 rounded hover:bg-slate-100">Register</Link>
            <Link href="/login" className="text-sm px-3 py-1 rounded border">Login</Link>
          </>
        )}
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full right-4 left-4 mt-2 bg-white rounded-lg border border-slate-200 shadow-lg p-4 space-y-3 z-40">
          <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="block text-slate-700 hover:text-indigo-600">Home</a>
          <a href="#about" onClick={(e) => handleNavClick(e, '#about')} className="block text-slate-700 hover:text-indigo-600">About Us</a>
          <a href="#services" onClick={(e) => handleNavClick(e, '#services')} className="block text-slate-700 hover:text-indigo-600">Services</a>
          <a href="#contact" onClick={(e) => handleNavClick(e, '#contact')} className="block text-slate-700 hover:text-indigo-600">Contact</a>
          {user ? (
            <>
              <Link href="/dashboard" className="block text-slate-700 hover:text-indigo-600">Dashboard</Link>
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); router.push('/login') }}
                className="block w-full text-left text-red-600 hover:bg-red-50 px-2 py-1 rounded"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/register" className="block text-slate-700 hover:text-indigo-600">Register</Link>
              <Link href="/login" className="block text-slate-700 hover:text-indigo-600">Login</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

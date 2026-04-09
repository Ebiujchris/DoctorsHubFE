import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState, useCallback } from 'react'
import { getCurrentUser, logout, getAuthToken } from '../services/auth'
import { fetchUnreadCount } from '../services/api'
import { useTheme } from '../hooks/useTheme'

export default function Navbar() {
  const router = useRouter()
  const isHome = router.pathname === '/'
  const [user, setUser] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const { dark, toggle: toggleTheme } = useTheme()

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
    <nav className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between bg-white/90 dark:bg-slate-800/90 backdrop-blur sticky top-0 z-40 shadow-lg border-b border-slate-200 dark:border-slate-700">
      <Link href="/" className="flex items-center gap-3 cursor-pointer">
        <div className="h-10 w-10 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">DH</div>
        <div className="font-semibold text-lg text-slate-800 dark:text-white">DoctorsHub</div>
      </Link>

      <div className="hidden md:flex items-center gap-6 text-slate-600 dark:text-slate-300">
        <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition">Home</a>
        <a href="#about" onClick={(e) => handleNavClick(e, '#about')} className="cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition">About Us</a>
        <a href="#services" onClick={(e) => handleNavClick(e, '#services')} className="cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition">Services</a>
        <a href="#contact" onClick={(e) => handleNavClick(e, '#contact')} className="cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition">Contact</a>
      </div>

      <button
        onClick={() => setMobileMenuOpen((prev) => !prev)}
        className="flex md:hidden items-center justify-center p-2 rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? '✕' : '☰'}
      </button>

      <div className="flex items-center gap-3">
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          aria-label="Toggle dark mode"
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? '☀️' : '🌙'}
        </button>

        {user ? (
          <>
            {/* Notification bell */}
            <Link href="/dashboard" className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition" aria-label="Notifications">
              <span className="text-xl">🔔</span>
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Link>
            <Link href="/dashboard" className="text-sm px-3 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition">Dashboard</Link>
            <button
              onClick={() => { logout(); router.push('/login') }}
              className="text-sm px-3 py-1 rounded border border-red-600 text-red-400 hover:bg-red-900/20 transition"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/register" className="text-sm px-3 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition">Register</Link>
            <Link href="/login" className="text-sm px-3 py-1 rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition">Login</Link>
          </>
        )}
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full right-4 left-4 mt-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl p-4 space-y-3 z-40">
          <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="block text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">Home</a>
          <a href="#about" onClick={(e) => handleNavClick(e, '#about')} className="block text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">About Us</a>
          <a href="#services" onClick={(e) => handleNavClick(e, '#services')} className="block text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">Services</a>
          <a href="#contact" onClick={(e) => handleNavClick(e, '#contact')} className="block text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">Contact</a>
          
          {/* Dark mode toggle for mobile */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 w-full text-left text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition py-2"
          >
            <span>{dark ? '☀️' : '🌙'}</span>
            <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          
          {user ? (
            <>
              <Link href="/dashboard" className="block text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">Dashboard</Link>
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); router.push('/login') }}
                className="block w-full text-left text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 px-2 py-1 rounded transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/register" className="block text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">Register</Link>
              <Link href="/login" className="block text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">Login</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

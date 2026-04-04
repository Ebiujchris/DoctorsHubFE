import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { getAuthToken, getCurrentUser } from '../services/auth'

export default function AuthDebug() {
  const [authStatus, setAuthStatus] = useState({
    hasToken: false,
    tokenLength: 0,
    tokenPreview: '',
    hasUser: false,
    userEmail: '',
    userRole: '',
    localStorage: {
      dh_token: null,
      dh_user: null
    }
  })

  useEffect(() => {
    // Check authentication status
    const token = getAuthToken()
    const user = getCurrentUser()
    
    const dhToken = localStorage.getItem('dh_token')
    const dhUser = localStorage.getItem('dh_user')

    setAuthStatus({
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenPreview: token ? token.substring(0, 50) + '...' : 'NO TOKEN',
      hasUser: !!user,
      userEmail: user?.email || 'No user',
      userRole: user?.role || 'No role',
      localStorage: {
        dh_token: dhToken ? `${dhToken.substring(0, 50)}... (length: ${dhToken.length})` : 'NOT FOUND',
        dh_user: dhUser ? `Found (${dhUser.length} chars)` : 'NOT FOUND'
      }
    })
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-8">🔍 Authentication Debug</h1>

          <div className="space-y-6">
            {/* Token Status */}
            <div className="border border-slate-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Token Status</h2>
              <div className="space-y-3 text-sm font-mono bg-slate-50 p-4 rounded">
                <div>
                  <span className="text-slate-600">Has Token:</span>
                  <span className={`ml-2 font-bold ${authStatus.hasToken ? 'text-green-600' : 'text-red-600'}`}>
                    {authStatus.hasToken ? '✅ YES' : '❌ NO'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Token Length:</span>
                  <span className="ml-2 font-bold text-slate-700">{authStatus.tokenLength} characters</span>
                </div>
                <div className="break-all">
                  <span className="text-slate-600">Token Preview:</span>
                  <span className="ml-2 font-bold text-slate-700">{authStatus.tokenPreview}</span>
                </div>
              </div>
            </div>

            {/* User Status */}
            <div className="border border-slate-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">User Status</h2>
              <div className="space-y-3 text-sm font-mono bg-slate-50 p-4 rounded">
                <div>
                  <span className="text-slate-600">Has User:</span>
                  <span className={`ml-2 font-bold ${authStatus.hasUser ? 'text-green-600' : 'text-red-600'}`}>
                    {authStatus.hasUser ? '✅ YES' : '❌ NO'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">User Email:</span>
                  <span className="ml-2 font-bold text-slate-700">{authStatus.userEmail}</span>
                </div>
                <div>
                  <span className="text-slate-600">User Role:</span>
                  <span className="ml-2 font-bold text-slate-700">{authStatus.userRole}</span>
                </div>
              </div>
            </div>

            {/* LocalStorage Status */}
            <div className="border border-slate-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">LocalStorage Status</h2>
              <div className="space-y-3 text-sm font-mono bg-slate-50 p-4 rounded">
                <div>
                  <span className="text-slate-600">dh_token:</span>
                  <span className="ml-2 font-bold text-slate-700">{authStatus.localStorage.dh_token}</span>
                </div>
                <div>
                  <span className="text-slate-600">dh_user:</span>
                  <span className="ml-2 font-bold text-slate-700">{authStatus.localStorage.dh_user}</span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
              <h2 className="text-xl font-bold text-blue-900 mb-4">📋 Recommendations</h2>
              <div className="space-y-2 text-sm text-blue-900">
                {!authStatus.hasToken && (
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">❌</span>
                    <span><strong>No Token:</strong> You are not logged in. Log in at <a href="/login" className="text-blue-600 hover:underline">/login</a></span>
                  </div>
                )}
                {authStatus.hasToken && !authStatus.hasUser && (
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600 font-bold">⚠️</span>
                    <span><strong>Token but no User:</strong> Token exists but user data is missing. Try logging in again.</span>
                  </div>
                )}
                {authStatus.hasToken && authStatus.hasUser && (
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✅</span>
                    <span><strong>Fully Authenticated:</strong> You should be able to book appointments. Try <a href="/dashboard" className="text-blue-600 hover:underline">going to dashboard</a></span>
                  </div>
                )}
              </div>
            </div>

            {/* Browser Console Help */}
            <div className="border border-slate-300 rounded-lg p-6 bg-slate-100">
              <h2 className="text-xl font-bold text-slate-800 mb-4">🖥️ How to Check in Browser Console</h2>
              <div className="space-y-3 text-sm text-slate-700 font-mono bg-white p-4 rounded border border-slate-200">
                <div>
                  <div className="text-slate-600 mb-1">Check token:</div>
                  <div className="bg-slate-50 p-2 rounded">
                    <code className="text-blue-600">localStorage.getItem('dh_token')</code>
                  </div>
                </div>
                <div>
                  <div className="text-slate-600 mb-1">Check user:</div>
                  <div className="bg-slate-50 p-2 rounded">
                    <code className="text-blue-600">localStorage.getItem('dh_user')</code>
                  </div>
                </div>
                <div className="mt-4 text-slate-600">
                  Open DevTools (F12) → Console tab → Paste the commands above
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <a href="/login" className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-center">
                Go to Login
              </a>
              <a href="/dashboard" className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-center">
                Go to Dashboard
              </a>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 font-semibold"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

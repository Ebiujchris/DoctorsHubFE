import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import Link from 'next/link'
import { login, googleLogin } from '../services/auth'

export default function Login(){
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Get return URL from query parameters
  const returnTo = router.query.returnTo || '/dashboard'

  // Initialize Google OAuth
  useEffect(() => {
    // Load Google Sign-In script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
          callback: window.handleGoogleCallback,
        })
      }
    }
    document.body.appendChild(script)

    // Handle Google callback
    window.handleGoogleCallback = async (credentialResponse) => {
      try {
        const { credential } = credentialResponse
        if (credential) {
          const response = await googleLogin(credential)
          setMessage('Login successful! Redirecting...')
          setTimeout(() => {
            window.location.href = decodeURIComponent(returnTo)
          }, 2000)
        }
      } catch (error) {
        console.error('Callback error:', error)
        setMessage(error.message || 'Google login failed.')
      }
    }
  }, [returnTo])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    setLoading(true)
    setMessage('')

    try {
      const response = await login({ email: formData.email, password: formData.password })
      console.log('✅ Login response:', response)
      console.log('✅ Token after login:', localStorage.getItem('dh_token') ? '✅ Found' : '❌ Missing')
      setMessage('Login successful! Redirecting...')
      setTimeout(() => {
        window.location.href = decodeURIComponent(returnTo)
      }, 2000)
    } catch(error){
      console.error('❌ Login error:', error)
      setMessage(error.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setMessage('')

    try {
      // Render Google button to trigger sign-in
      if (window.google) {
        window.google.accounts.id.renderButton(
          document.getElementById('google-button-container'),
          {
            type: 'standard',
            size: 'large',
            text: 'signin_with',
            locale: 'en_US',
            width: '100%',
          }
        )
      }
    } catch (error) {
      console.error('Google login error:', error)
      setMessage('Google login not available. Please use email login.')
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleRenderGoogleButton = () => {
    if (window.google) {
      window.google.accounts.id.renderButton(
        document.getElementById('google-button-container'),
        {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: '100%',
        }
      )
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <Navbar />
      
      <main className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Welcome Back</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Log in to your DoctorsHub account</p>

            {message && (
              <div className={`p-4 rounded mb-6 text-sm ${
                message.includes('successful') 
                  ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
                  : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-indigo-500"
                  />
                  Remember me
                </label>
                <a href="#forgot" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold">
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition mt-6"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-300 dark:bg-slate-600"></div>
              <span className="text-slate-500 dark:text-slate-400 text-sm">or</span>
              <div className="flex-1 h-px bg-slate-300 dark:bg-slate-600"></div>
            </div>

            {/* Social Login - Google OAuth */}
            <button
              type="button"
              onClick={handleRenderGoogleButton}
              disabled={googleLoading}
              className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 py-2 rounded-lg font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>🔵</span>
              {googleLoading ? 'Signing in...' : 'Continue with Google'}
            </button>
            
            {/* Hidden Google Button Container */}
            <div id="google-button-container" className="hidden mt-2"></div>

            {/* Register Link */}
            <p className="text-center text-slate-600 dark:text-slate-400 text-sm mt-6">
              Don't have an account?{' '}
              <Link href={`/register${router.query.returnTo ? `?returnTo=${encodeURIComponent(router.query.returnTo)}` : ''}`} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

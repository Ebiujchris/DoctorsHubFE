import { useState } from 'react'
import Navbar from '../components/Navbar'
import Link from 'next/link'

export default function Register(){
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'patient'
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Basic validation
    if(formData.password !== formData.confirmPassword){
      setMessage('Passwords do not match!')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      // TODO: Connect to your backend API
      console.log('Registration data:', formData)
      setMessage('Registration successful! Redirecting to login...')
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
    } catch(error){
      setMessage('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Create Account</h1>
            <p className="text-slate-600 mb-6">Join DoctorsHub today</p>

            {message && (
              <div className={`p-4 rounded mb-6 text-sm ${
                message.includes('successful') 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="John Doe"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="you@example.com"
                />
              </div>

              {/* User Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  I am a
                </label>
                <select
                  name="userType"
                  value={formData.userType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="clinic">Clinic</option>
                </select>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="••••••••"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="••••••••"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {loading ? 'Creating Account...' : 'Register'}
              </button>
            </form>

            {/* Login Link */}
            <p className="text-center text-slate-600 text-sm mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

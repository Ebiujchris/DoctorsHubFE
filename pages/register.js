import { useState } from 'react'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import Link from 'next/link'
import { register, setCurrentUser } from '../services/auth'

const SPECIALTIES = [
  { value: 'general-practitioner', name: 'General Practitioner', icon: '🩺' },
  { value: 'cardiologist', name: 'Cardiologist', icon: '❤️' },
  { value: 'psychiatrist', name: 'Psychiatrist', icon: '🧠' },
  { value: 'dentist', name: 'Dentist', icon: '🦷' },
  { value: 'nurse', name: 'Nurse', icon: '💉' },
  { value: 'home-carer', name: 'Home Carer', icon: '🏠' }
]

export default function Register(){
  const router = useRouter()
  const [step, setStep] = useState('role') // role | specialty | form
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: '',
    specialty: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // Get return URL from query parameters
  const returnTo = router.query.returnTo || '/dashboard'

  const handleRoleSelect = (role) => {
    setFormData(prev => ({
      ...prev,
      role
    }))
    if (role === 'patient') {
      setStep('form')
    } else {
      setStep('specialty')
    }
  }

  const handleSpecialtySelect = (specialty) => {
    setFormData(prev => ({
      ...prev,
      specialty
    }))
    setStep('form')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (name === 'password') {
      validatePassword(value)
    }
  }

  const validatePassword = (pwd) => {
    const hasUpperCase = /[A-Z]/.test(pwd)
    const hasMinLength = pwd.length >= 8
    
    if (!pwd) {
      setPasswordError('')
    } else if (!hasMinLength) {
      setPasswordError('Password must be at least 8 characters')
    } else if (!hasUpperCase) {
      setPasswordError('Password must contain at least one uppercase letter')
    } else {
      setPasswordError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if(!formData.password || formData.password.length < 8){
      setMessage('Password must be at least 8 characters')
      return
    }
    if(!/[A-Z]/.test(formData.password)){
      setMessage('Password must contain at least one uppercase letter')
      return
    }
    
    if(formData.password !== formData.confirmPassword){
      setMessage('Passwords do not match!')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const { confirmPassword, ...payload } = formData
      const response = await register(payload)
      console.log('Registration response:', response)
      setCurrentUser(response.user)
      setMessage('Registration successful! Redirecting...')
      setTimeout(() => {
        window.location.href = decodeURIComponent(returnTo)
      }, 2000)
    } catch(error){
      console.error(error)
      setMessage(error.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <Navbar />
      
      <main className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-2xl">
          {/* STEP 1: Role Selection */}
          {step === 'role' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 sm:p-10">
              <div className="text-center mb-10">
                <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-2">Join DoctorsHub</h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">Choose how you'd like to use DoctorsHub</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Patient Card */}
                <button
                  onClick={() => handleRoleSelect('patient')}
                  className="group p-8 rounded-xl border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 text-center bg-slate-50 dark:bg-slate-700"
                >
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">👤</div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Patient</h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">Book appointments and get healthcare services</p>
                  <span className="inline-block px-4 py-2 bg-indigo-100 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-medium">
                    Find Care
                  </span>
                </button>

                {/* Healthcare Provider Card */}
                <button
                  onClick={() => handleRoleSelect('doctor')}
                  className="group p-8 rounded-xl border-2 border-slate-300 dark:border-slate-600 hover:border-green-500 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300 text-center bg-slate-50 dark:bg-slate-700"
                >
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">👨‍⚕️</div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400">Healthcare Provider</h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">Offer services and manage appointments</p>
                  <span className="inline-block px-4 py-2 bg-green-100 dark:bg-green-600/20 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                    Provide Care
                  </span>
                </button>
              </div>

              <p className="text-center text-slate-500 dark:text-slate-500 text-sm mt-8">
                Already have an account?{' '}
                <Link href={`/login${router.query.returnTo ? `?returnTo=${encodeURIComponent(router.query.returnTo)}` : ''}`} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold">
                  Login here
                </Link>
              </p>
            </div>
          )}

          {/* STEP 2: Specialty Selection */}
          {step === 'specialty' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 sm:p-10">
              <div className="mb-10">
                <button
                  onClick={() => setStep('role')}
                  className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium mb-6 transition"
                >
                  ← Back
                </button>
                <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-2">Select Your Specialty</h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">Choose the healthcare service you provide</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SPECIALTIES.map((specialty) => (
                  <button
                    key={specialty.value}
                    onClick={() => handleSpecialtySelect(specialty.value)}
                    className="group p-6 rounded-xl border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-500 hover:shadow-md hover:shadow-indigo-500/20 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 text-center"
                  >
                    <div className="text-5xl mb-3">{specialty.icon}</div>
                    <h3 className="font-semibold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{specialty.name}</h3>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Registration Form */}
          {step === 'form' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 sm:p-10">
              <div className="mb-8">
                <button
                  onClick={() => setStep(formData.role === 'patient' ? 'role' : 'specialty')}
                  className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium mb-6 transition"
                >
                  ← Back
                </button>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Create Your Account</h1>
                <p className="text-slate-600 dark:text-slate-400">
                  {formData.role === 'patient' ? 'Complete your profile to get started' : `Register as a ${SPECIALTIES.find(s => s.value === formData.specialty)?.name}`}
                </p>
              </div>

              {message && (
                <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${
                  message.includes('successful') 
                    ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
                    : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                }`}>
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      placeholder="John"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="you@example.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl transition"
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2 font-medium">{passwordError}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-3.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl transition"
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 mt-6"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              {/* Login Link */}
              <p className="text-center text-slate-600 dark:text-slate-400 text-sm mt-6">
                Already have an account?{' '}
                <Link href={`/login${router.query.returnTo ? `?returnTo=${encodeURIComponent(router.query.returnTo)}` : ''}`} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold">
                  Login here
                </Link>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

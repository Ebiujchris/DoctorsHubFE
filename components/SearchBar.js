import { useState } from 'react'
import { useRouter } from 'next/router'

export default function SearchBar({ onSearch }) {
  const router = useRouter()
  const [specialty, setSpecialty] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const specialties = [
    { value: 'General Practitioner', icon: '🩺' },
    { value: 'Cardiologist', icon: '❤️' },
    { value: 'Psychiatrist', icon: '🧠' },
    { value: 'Dentist', icon: '🦷' },
    { value: 'Nurse', icon: '💉' },
    { value: 'Home Carer', icon: '🏠' },
    { value: 'Dermatologist', icon: '✨' },
    { value: 'Orthopedist', icon: '🦴' },
    { value: 'Pediatrician', icon: '👶' },
    { value: 'Eye Specialist', icon: '👁️' }
  ]

  const handleSearch = async (e) => {
    e.preventDefault()
    setError('')

    if (!specialty) {
      setError('Please select a specialty')
      return
    }

    setLoading(true)
    try {
      // Redirect to search results page with query params
      await router.push(`/search-results?specialty=${encodeURIComponent(specialty)}`)
      if (onSearch) {
        onSearch(specialty)
      }
    } catch (err) {
      setError('Error performing search. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
        <form onSubmit={handleSearch} className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
          {/* Specialty Dropdown */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-white mb-3">
              What type of care do you need?
            </label>
            <div className="relative">
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full px-4 py-4 rounded-xl bg-white/90 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 transition appearance-none cursor-pointer"
              >
                <option value="">Choose a specialty...</option>
                {specialties.map((spec) => (
                  <option key={spec.value} value={spec.value} className="text-slate-800">
                    {spec.icon} {spec.value}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Availability
            </label>
            <select className="w-full px-4 py-4 rounded-xl bg-white/90 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 transition">
              <option>Any time</option>
              <option>Today</option>
              <option>This week</option>
              <option>Next week</option>
            </select>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Searching...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Find Providers
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-400 rounded-xl text-red-200 text-sm flex items-center gap-2">
            <span>⚠️</span>
            {error}
          </div>
        )}

        {/* Popular Searches */}
        <div className="mt-6 pt-6 border-t border-white/20">
          <p className="text-white/80 text-sm mb-3">Popular searches:</p>
          <div className="flex flex-wrap gap-2">
            {['General Practitioner', 'Dentist', 'Psychiatrist', 'Cardiologist'].map((popular) => (
              <button
                key={popular}
                onClick={() => setSpecialty(popular)}
                className="px-3 py-1 bg-white/20 text-white text-sm rounded-full hover:bg-white/30 transition"
              >
                {popular}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

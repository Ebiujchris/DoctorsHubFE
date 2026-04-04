import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import { searchDoctors } from '../services/api'
import { getCurrentUser } from '../services/auth'

export default function SearchResults() {
  const router = useRouter()
  const { specialty, location } = router.query
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!specialty || !location) return

    const loadResults = async () => {
      try {
        setLoading(true)
        setError('')
        const results = await searchDoctors(specialty, location)
        setDoctors(results)
      } catch (err) {
        setError(err.message || 'Error loading search results')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadResults()
  }, [specialty, location])

  const handleBooking = (doctorId) => {
    const user = getCurrentUser()
    if (!user) {
      router.push('/login')
    } else {
      router.push(`/dashboard?booking=${doctorId}`)
    }
  }

  const handleNewSearch = () => {
    router.push('/#search')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Search Results</h1>
          <p className="text-indigo-100">
            {specialty && location
              ? `Showing results for ${specialty} in ${location}`
              : 'Loading...'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Filters (Optional) */}
          <div className="lg:col-span-1">
            <button
              onClick={handleNewSearch}
              className="w-full mb-6 px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              ← New Search
            </button>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="font-semibold text-slate-800 mb-4">Filters</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">Rating</label>
                  <input type="range" min="1" max="5" className="w-full" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">Price Range</label>
                  <select className="w-full px-3 py-2 border rounded-lg">
                    <option>All Prices</option>
                    <option>Under $50</option>
                    <option>$50 - $100</option>
                    <option>$100+</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Results - Main Content */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="space-y-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex gap-6">
                      <div className="w-24 h-24 bg-slate-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-6 bg-slate-200 rounded w-1/4 mb-2"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-600 font-semibold mb-4">{error}</p>
                <button
                  onClick={handleNewSearch}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : doctors.length === 0 ? (
              <div className="bg-slate-100 rounded-xl p-12 text-center">
                <p className="text-slate-600 text-lg mb-4">No doctors found matching your criteria</p>
                <button
                  onClick={handleNewSearch}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Try a Different Search
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Results Count */}
                <p className="text-slate-600 font-medium">Found {doctors.length} doctor{doctors.length !== 1 ? 's' : ''}</p>

                {/* Doctor Cards */}
                {doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg border border-slate-100 hover:border-indigo-200 transition-all p-6"
                  >
                    <div className="flex flex-col sm:flex-row gap-6">
                      {/* Doctor Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={doctor.image}
                          alt={doctor.name}
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                      </div>

                      {/* Doctor Info */}
                      <div className="flex-1">
                        <h3 className="text-2xl font-semibold text-slate-800 mb-1">{doctor.name}</h3>
                        <p className="text-indigo-600 font-medium mb-3">{doctor.specialty}</p>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-yellow-400">⭐</span>
                          <span className="font-semibold text-slate-700">{doctor.rating}</span>
                          <span className="text-slate-500 text-sm">({doctor.reviews} reviews)</span>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 mb-4">
                          <p>📅 <span className="font-medium">{doctor.experience} experience</span></p>
                          <p>⏱️ <span className="font-medium">Response: {doctor.responseTime}</span></p>
                        </div>
                      </div>

                      {/* Book Button */}
                      <div className="flex flex-col justify-center gap-2">
                        <button
                          onClick={() => handleBooking(doctor.id)}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors whitespace-nowrap"
                        >
                          Book Now
                        </button>
                        <button className="px-6 py-2 border-2 border-slate-300 text-slate-700 rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-colors whitespace-nowrap">
                          View Profile
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

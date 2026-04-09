import { useEffect, useState } from 'react'
import { fetchFeaturedDoctors_Combined } from '../services/api'
import { useRouter } from 'next/router'
import { getCurrentUser } from '../services/auth'

export default function FeaturedDoctors() {
  const router = useRouter()
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await fetchFeaturedDoctors_Combined()
        setDoctors(data)
      } catch (err) {
        console.error('Error loading doctors:', err)
        setError('Failed to load healthcare providers')
      } finally {
        setLoading(false)
      }
    }
    loadDoctors()
  }, [])

  const handleBooking = (doctorId) => {
    const user = getCurrentUser()
    if (!user) {
      router.push('/login')
    } else {
      router.push(`/dashboard?booking=${doctorId}`)
    }
  }

  if (loading) {
    return (
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white mb-12 text-center">Featured Healthcare Providers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="w-full h-48 bg-slate-200 dark:bg-slate-700 rounded-xl mb-4"></div>
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white mb-4">Featured Healthcare Providers</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">Top-rated doctors, nurses & carers ready to serve you</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400 text-center mb-8">
            {error}
          </div>
        )}

        {doctors.length === 0 && !loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400 text-lg">Register as a healthcare provider to be featured here!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className="group bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-indigo-500/20 border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-600 transition-all duration-300 overflow-hidden"
              >
                {/* Doctor Image */}
                <div className="relative h-48 bg-gradient-to-br from-indigo-400 to-blue-500 overflow-hidden">
                  <img
                    src={doctor.image}
                    alt={doctor.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                {/* Doctor Info */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-1">{doctor.name}</h3>
                  <p className="text-indigo-600 dark:text-indigo-400 font-medium mb-3">{doctor.specialty}</p>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-yellow-400">⭐</span>
                    <span className="text-slate-700 dark:text-slate-200 font-semibold">{doctor.rating}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-sm">({doctor.reviews} reviews)</span>
                  </div>

                  {/* Experience and Response Time */}
                  <div className="space-y-2 mb-4 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-4">
                    <p>📅 <span className="font-medium">{doctor.experience} experience</span></p>
                    <p>⏱️ <span className="font-medium">Response: {doctor.responseTime}</span></p>
                  </div>

                  {/* Book Button */}
                  <button
                    onClick={() => handleBooking(doctor.id)}
                    className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    Book Now →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All Button */}
        <div className="text-center mt-12">
          <button
            onClick={() => router.push('/search-results?specialty=all&location=all')}
            className="px-8 py-3 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 rounded-lg font-semibold hover:bg-indigo-600 hover:text-white transition-colors"
          >
            View All Providers →
          </button>
        </div>
      </div>
    </section>
  )
}

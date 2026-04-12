import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { fetchSpecialties } from '../services/api'

export default function Specialties() {
  const router = useRouter()
  const [specialties, setSpecialties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadSpecialties = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await fetchSpecialties()
        setSpecialties(data)
      } catch (err) {
        console.error('Error loading specialties:', err)
        setError('Failed to load specialties')
        // Fallback to basic specialties without counts if API fails
        setSpecialties([
          { id: 1, name: 'General Practitioner', icon: '🩺', count: null },
          { id: 2, name: 'Cardiologist', icon: '❤️', count: null },
          { id: 3, name: 'Psychiatrist', icon: '🧠', count: null },
          { id: 4, name: 'Dentist', icon: '🦷', count: null },
          { id: 5, name: 'Nurse', icon: '💊', count: null },
          { id: 6, name: 'Home Carer', icon: '🏠', count: null }
        ])
      } finally {
        setLoading(false)
      }
    }
    loadSpecialties()
  }, [])

  const handleSpecialtyClick = (specialty) => {
    router.push(`/search-results?specialty=${encodeURIComponent(specialty.name)}`)
  }

  if (loading) {
    return (
      <section className="py-20 bg-slate-50 dark:bg-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white mb-4">Browse by Specialty</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">Find qualified healthcare professionals across various specialties</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse p-6 bg-white dark:bg-slate-700 rounded-xl">
                <div className="w-16 h-16 bg-slate-200 dark:bg-slate-600 rounded-lg mb-4"></div>
                <div className="h-6 bg-slate-200 dark:bg-slate-600 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white mb-4">Browse by Specialty</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">Find qualified healthcare professionals across various specialties</p>
        </div>

        {error && (
          <div className="bg-yellow-50 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-yellow-600 dark:text-yellow-400 text-center mb-8">
            Using cached specialty data. Some counts may not be current.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {specialties.map((specialty) => (
            <button
              key={specialty.id}
              onClick={() => handleSpecialtyClick(specialty)}
              className="group p-6 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/20 hover:scale-105 transition-all duration-300 text-left"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{specialty.icon}</div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{specialty.name}</h3>
              <p className="text-slate-600 dark:text-slate-400">
                {specialty.count !== null ? `${specialty.count} providers available` : 'Browse providers'}
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

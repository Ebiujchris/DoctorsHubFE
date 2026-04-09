import { useState } from 'react'
import { useRouter } from 'next/router'

export default function SearchBar({ onSearch }) {
  const router = useRouter()
  const [specialty, setSpecialty] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const specialties = [
    'General Practitioner',
    'Cardiologist',
    'Psychiatrist',
    'Dentist',
    'Nurse',
    'Home Carer',
    'Dermatologist',
    'Orthopedist',
    'Pediatrician',
    'Eye Specialist'
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
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        {/* Specialty Dropdown */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Specialty *</label>
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
          >
            <option value="">Select a specialty...</option>
            {specialties.map((spec) => (
              <option key={spec} value={spec} className="text-slate-800">
                {spec}
              </option>
            ))}
          </select>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors sm:col-span-2"
        >
          {loading ? 'Searching...' : 'Search Doctors'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}

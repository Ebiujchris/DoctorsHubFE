import { useState } from 'react'
import { useRouter } from 'next/router'

export default function Specialties() {
  const router = useRouter()
  const [specialties] = useState([
    { id: 1, name: 'General Practitioner', icon: '🩺', count: 324 },
    { id: 2, name: 'Cardiologist', icon: '❤️', count: 187 },
    { id: 3, name: 'Psychiatrist', icon: '🧠', count: 256 },
    { id: 4, name: 'Dentist', icon: '🦷', count: 412 },
    { id: 5, name: 'Nurse', icon: '💊', count: 289 },
    { id: 6, name: 'Home Carer', icon: '🏠', count: 156 }
  ])

  const handleSpecialtyClick = (specialty) => {
    router.push(`/search-results?specialty=${encodeURIComponent(specialty.name)}&location=all`)
  }

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white mb-4">Browse by Specialty</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">Find qualified healthcare professionals across various specialties</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {specialties.map((specialty) => (
            <button
              key={specialty.id}
              onClick={() => handleSpecialtyClick(specialty)}
              className="group p-6 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/20 hover:scale-105 transition-all duration-300 text-left"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{specialty.icon}</div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{specialty.name}</h3>
              <p className="text-slate-600 dark:text-slate-400">{specialty.count} doctors available</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

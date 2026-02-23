import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import { getCurrentUser } from '../services/auth'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const u = getCurrentUser()
    if (!u) {
      router.replace('/login')
      return
    }
    setUser(u)
  }, [router])

  if (!user) {
    // while redirecting or loading
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="max-w-5xl mx-auto p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-600 mt-1">Welcome to your DoctorsHub account</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* welcome card */}
          <div className="bg-white rounded-lg shadow p-6">
            {user.role === 'patient' ? (
              <>
                <h2 className="text-xl font-semibold text-indigo-700 mb-2">
                  Hello, {user.firstName}
                </h2>
                <p className="text-slate-600">
                  Here's a quick overview of your activity.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-indigo-700 mb-2">
                  Dr. {user.lastName}
                </h2>
                <p className="text-slate-600">
                  Manage your patients and schedule below.
                </p>
              </>
            )}
          </div>

          {/* placeholder panel */}
          <div className="bg-white rounded-lg shadow p-6">
            {user.role === 'patient' ? (
              <>
                <h3 className="font-medium text-slate-700 mb-2">Upcoming Appointments</h3>
                <ul className="list-disc pl-5 text-slate-700">
                  <li>No appointments yet.</li>
                </ul>
              </>
            ) : (
              <>
                <h3 className="font-medium text-slate-700 mb-2">Patient Requests</h3>
                <ul className="list-disc pl-5 text-slate-700">
                  <li>No patients scheduled.</li>
                </ul>
              </>
            )}
          </div>
        </div>

        {/* add additional sections later */}
      </main>
    </div>
  )
}

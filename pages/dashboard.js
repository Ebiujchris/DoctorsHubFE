import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import { getCurrentUser } from '../services/auth'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

          {/* notifications card */}
          <div
            onClick={() => setShowNotifications(true)}
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Notifications</h2>
                <p className="text-slate-600 text-sm mt-1">Click to view</p>
              </div>
              <div className="text-right">
                <div className="bg-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold">
                  3
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* notifications modal */}
        {showNotifications && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              {/* modal header */}
              <div className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">🔔 Notifications</h2>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-white hover:bg-indigo-700 w-8 h-8 flex items-center justify-center rounded transition"
                >
                  ✕
                </button>
              </div>

              {/* modal content */}
              <div className="overflow-y-auto flex-1 p-6 space-y-3">
                {user.role === 'patient' ? (
                  <>
                    <div className="border-l-4 border-indigo-500 pl-4 py-3 bg-indigo-50 rounded">
                      <p className="text-sm font-medium text-slate-800">Appointment Reminder</p>
                      <p className="text-sm text-slate-600 mt-1">You have an appointment coming up this week.</p>
                      <p className="text-xs text-slate-500 mt-2">2 hours ago</p>
                    </div>
                    <div className="border-l-4 border-green-500 pl-4 py-3 bg-green-50 rounded">
                      <p className="text-sm font-medium text-slate-800">Prescription Available</p>
                      <p className="text-sm text-slate-600 mt-1">Your prescription is ready for pickup.</p>
                      <p className="text-xs text-slate-500 mt-2">1 day ago</p>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50 rounded">
                      <p className="text-sm font-medium text-slate-800">Medical Record Updated</p>
                      <p className="text-sm text-slate-600 mt-1">Your doctor has added a new note to your file.</p>
                      <p className="text-xs text-slate-500 mt-2">3 days ago</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="border-l-4 border-indigo-500 pl-4 py-3 bg-indigo-50 rounded">
                      <p className="text-sm font-medium text-slate-800">New Patient Booking</p>
                      <p className="text-sm text-slate-600 mt-1">A patient has booked an appointment with you.</p>
                      <p className="text-xs text-slate-500 mt-2">30 minutes ago</p>
                    </div>
                    <div className="border-l-4 border-yellow-500 pl-4 py-3 bg-yellow-50 rounded">
                      <p className="text-sm font-medium text-slate-800">Appointment Cancellation</p>
                      <p className="text-sm text-slate-600 mt-1">A patient has cancelled their appointment.</p>
                      <p className="text-xs text-slate-500 mt-2">2 hours ago</p>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-4 py-3 bg-purple-50 rounded">
                      <p className="text-sm font-medium text-slate-800">Lab Results Ready</p>
                      <p className="text-sm text-slate-600 mt-1">Results for your patient John Smith are ready.</p>
                      <p className="text-xs text-slate-500 mt-2">5 hours ago</p>
                    </div>
                  </>
                )}
              </div>

              {/* modal footer */}
              <div className="bg-slate-50 px-6 py-4 border-t flex justify-end gap-3">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-800 rounded hover:bg-slate-300 transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

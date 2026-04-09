import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getCurrentUser, getAuthToken } from '../../services/auth'
import { getAllTestimonials, approveTestimonial } from '../../services/api'

export default function AdminTestimonials() {
  const router = useRouter()
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push('/login')
      return
    }
    
    loadTestimonials()
  }, [router])

  const loadTestimonials = async () => {
    try {
      const token = getAuthToken()
      const data = await getAllTestimonials(token)
      setTestimonials(data)
    } catch (error) {
      console.error('Error loading testimonials:', error)
      setMessage('Error loading testimonials')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (testimonialId) => {
    try {
      const token = getAuthToken()
      await approveTestimonial(testimonialId, token)
      setMessage('Testimonial approved successfully!')
      loadTestimonials() // Reload to show updated status
    } catch (error) {
      console.error('Error approving testimonial:', error)
      setMessage('Error approving testimonial')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading testimonials...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            Admin: Testimonials Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Review and approve user testimonials for the homepage
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('Error') 
              ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
              : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
          }`}>
            {message}
          </div>
        )}

        <div className="grid gap-6">
          {testimonials.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-8 text-center">
              <p className="text-slate-600 dark:text-slate-400">No testimonials found</p>
            </div>
          ) : (
            testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-white">
                      {testimonial.user.firstName} {testimonial.user.lastName}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {testimonial.user.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      testimonial.isApproved
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                        : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400'
                    }`}>
                      {testimonial.isApproved ? 'Approved' : 'Pending'}
                    </span>
                    {!testimonial.isApproved && (
                      <button
                        onClick={() => handleApprove(testimonial.id)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} className="text-lg">
                          {star <= testimonial.rating ? '⭐' : '☆'}
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      ({testimonial.rating}/5)
                    </span>
                  </div>
                  
                  {testimonial.title && (
                    <h4 className="font-medium text-slate-800 dark:text-white mb-2">
                      "{testimonial.title}"
                    </h4>
                  )}
                  
                  <p className="text-slate-700 dark:text-slate-300 italic">
                    "{testimonial.message}"
                  </p>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Submitted: {new Date(testimonial.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
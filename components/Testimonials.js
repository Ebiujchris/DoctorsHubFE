import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { fetchTestimonials } from '../services/api'
import { getCurrentUser } from '../services/auth'
import TestimonialModal from './TestimonialModal'

export default function Testimonials() {
  const router = useRouter()
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadTestimonials()
    
    // Check if user should see testimonial modal after login
    const shouldShowModal = localStorage.getItem('showTestimonialModal')
    const urlParam = router.query.testimonial
    
    if (shouldShowModal === 'true' || urlParam === 'true') {
      const user = getCurrentUser()
      
      if (user) {
        setShowModal(true)
        localStorage.removeItem('showTestimonialModal')
        // Clean up URL parameter
        if (urlParam) {
          router.replace('/', undefined, { shallow: true })
        }
      }
    }
  }, [router])

  // Additional effect to handle authentication state changes
  useEffect(() => {
    const shouldShowModal = localStorage.getItem('showTestimonialModal')
    const urlParam = router.query.testimonial
    
    if ((shouldShowModal === 'true' || urlParam === 'true') && !showModal) {
      const user = getCurrentUser()
      if (user) {
        setShowModal(true)
        localStorage.removeItem('showTestimonialModal')
        // Clean up URL parameter
        if (urlParam) {
          router.replace('/', undefined, { shallow: true })
        }
      }
    }
  }, [showModal, router.query.testimonial])

  const loadTestimonials = async () => {
    try {
      const data = await fetchTestimonials()
      setTestimonials(data)
    } catch (error) {
      console.error('Error loading testimonials:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleShareExperience = () => {
    const user = getCurrentUser()
    
    if (!user) {
      // Store intent to show modal after login
      localStorage.setItem('showTestimonialModal', 'true')
      // Redirect to login with return URL
      router.push('/login?returnTo=' + encodeURIComponent('/?testimonial=true'))
    } else {
      setShowModal(true)
    }
  }

  const handleTestimonialSuccess = () => {
    // Reload testimonials to show the new one (if approved)
    loadTestimonials()
  }

  const renderStars = (rating) => {
    return '⭐'.repeat(rating)
  }

  if (loading) {
    return (
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white mb-12 text-center">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
                <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
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
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white mb-4">What Our Users Say</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">Real experiences from thousands of satisfied patients</p>
        </div>

        {testimonials.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400 text-lg">No testimonials available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-slate-50 dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:shadow-indigo-500/20 hover:border-indigo-200 dark:hover:border-indigo-600 transition-all duration-300"
              >
                {/* Stars */}
                <div className="text-lg mb-4">{renderStars(testimonial.rating)}</div>

                {/* Title */}
                {testimonial.title && (
                  <h3 className="font-semibold text-slate-800 dark:text-white mb-3">{testimonial.title}</h3>
                )}

                {/* Feedback */}
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6 italic">"{testimonial.feedback}"</p>

                {/* Author Info */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <p className="font-semibold text-slate-800 dark:text-white">{testimonial.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{testimonial.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-slate-700 dark:text-slate-300 mb-6">Join thousands of patients who trust DoctorsHub</p>
          <button 
            onClick={handleShareExperience}
            className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Share Your Experience
          </button>
        </div>
      </div>

      {/* Testimonial Modal */}
      <TestimonialModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleTestimonialSuccess}
      />
    </section>
  )
}

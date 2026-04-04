import { useEffect, useState } from 'react'
import { fetchTestimonials } from '../services/api'

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
    loadTestimonials()
  }, [])

  const renderStars = (rating) => {
    return '⭐'.repeat(rating)
  }

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-12 text-center">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="h-24 bg-slate-200 rounded mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">What Our Users Say</h2>
          <p className="text-lg text-slate-600">Real experiences from thousands of satisfied patients</p>
        </div>

        {testimonials.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 text-lg">No testimonials available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-white p-8 rounded-xl shadow-md border border-slate-100 hover:shadow-lg hover:border-indigo-200 transition-all duration-300"
              >
                {/* Stars */}
                <div className="text-lg mb-4">{renderStars(testimonial.rating)}</div>

                {/* Feedback */}
                <p className="text-slate-700 leading-relaxed mb-6 italic">"{testimonial.feedback}"</p>

                {/* Author Info */}
                <div className="border-t border-slate-200 pt-4">
                  <p className="font-semibold text-slate-800">{testimonial.name}</p>
                  <p className="text-sm text-slate-500">{testimonial.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-slate-700 mb-6">Join thousands of patients who trust DoctorsHub</p>
          <button className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
            Share Your Experience
          </button>
        </div>
      </div>
    </section>
  )
}

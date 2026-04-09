import { useState, useEffect } from 'react'
import { submitTestimonial, getUserTestimonial } from '../services/api'
import { getAuthToken } from '../services/auth'

export default function TestimonialModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    message: ''
  })
  const [hoverRating, setHoverRating] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [existingTestimonial, setExistingTestimonial] = useState(null)
  const [checkingExisting, setCheckingExisting] = useState(true)

  useEffect(() => {
    if (isOpen) {
      checkExistingTestimonial()
    }
  }, [isOpen])

  const checkExistingTestimonial = async () => {
    setCheckingExisting(true)
    try {
      const token = getAuthToken()
      const testimonial = await getUserTestimonial(token)
      setExistingTestimonial(testimonial)
    } catch (error) {
      console.error('Error checking existing testimonial:', error)
    } finally {
      setCheckingExisting(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.rating === 0) {
      setError('Please select a rating')
      return
    }
    
    if (formData.message.length < 10) {
      setError('Please write at least 10 characters for your message')
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = getAuthToken()
      await submitTestimonial(formData, token)
      onSuccess()
      onClose()
      // Reset form
      setFormData({ rating: 0, title: '', message: '' })
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const StarRating = () => (
    <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHoverRating(star)}
          onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
          className="text-3xl transition-transform hover:scale-110 focus:outline-none"
        >
          {star <= (hoverRating || formData.rating) ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Share Your Experience</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
            >
              ✕
            </button>
          </div>

          {checkingExisting ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Checking your testimonial status...</p>
            </div>
          ) : existingTestimonial ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Thank You!</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                You've already submitted a testimonial. It's currently being reviewed by our team.
              </p>
              <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 text-left">
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span key={star} className="text-lg">
                      {star <= existingTestimonial.rating ? '⭐' : '☆'}
                    </span>
                  ))}
                </div>
                {existingTestimonial.title && (
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-1">
                    {existingTestimonial.title}
                  </h4>
                )}
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  "{existingTestimonial.message}"
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                  Status: {existingTestimonial.isApproved ? 'Approved' : 'Pending Review'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Tell us about your experience with DoctorsHub! Your feedback helps us improve and helps other users discover our platform.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    How would you rate DoctorsHub? *
                  </label>
                  <StarRating />
                  {formData.rating > 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                      {formData.rating === 1 && "We're sorry to hear that. Please let us know how we can improve."}
                      {formData.rating === 2 && "We appreciate your feedback. How can we do better?"}
                      {formData.rating === 3 && "Thank you for your feedback. What can we improve?"}
                      {formData.rating === 4 && "Great! We're glad you had a good experience."}
                      {formData.rating === 5 && "Wonderful! We're thrilled you love DoctorsHub!"}
                    </p>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Title (Optional)
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    maxLength={100}
                    placeholder="e.g., Great platform for finding doctors"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Your Experience *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    minLength={10}
                    maxLength={500}
                    rows={4}
                    placeholder="Share your experience with DoctorsHub. What did you like? How did it help you?"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {formData.message.length}/500 characters (minimum 10)
                  </p>
                </div>

                {error && (
                  <div className="bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || formData.rating === 0 || formData.message.length < 10}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {loading ? 'Submitting...' : 'Submit Testimonial'}
                  </button>
                </div>
              </form>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
                Your testimonial will be reviewed before being published on our website.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
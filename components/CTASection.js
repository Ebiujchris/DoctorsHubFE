import { useRouter } from 'next/router'

export default function CTASection() {
  const router = useRouter()

  return (
    <section className="py-20 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-700 dark:to-blue-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl sm:text-5xl font-bold mb-4">Ready to Book Your Appointment?</h2>
          <p className="text-lg sm:text-xl text-indigo-100 dark:text-indigo-200 mb-8">
            Connect with top healthcare professionals. Search, compare, and book appointments with ease.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/#search')}
              className="px-8 py-4 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-slate-100 transition-colors shadow-lg hover:shadow-xl"
            >
              Start Searching
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-8 py-4 bg-indigo-700 dark:bg-indigo-800 text-white rounded-lg font-semibold hover:bg-indigo-800 dark:hover:bg-indigo-900 border-2 border-white transition-colors"
            >
              Sign In
            </button>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 pt-8 border-t border-indigo-400 dark:border-indigo-500">
            <p className="text-indigo-100 dark:text-indigo-200 mb-6">Trusted by over 100,000+ users</p>
            <div className="flex justify-center items-center gap-8 flex-wrap">
              <div className="text-center">
                <p className="text-3xl font-bold mb-2">10K+</p>
                <p className="text-indigo-100 dark:text-indigo-200 text-sm">Doctors</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold mb-2">100K+</p>
                <p className="text-indigo-100 dark:text-indigo-200 text-sm">Patients</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold mb-2">1M+</p>
                <p className="text-indigo-100 dark:text-indigo-200 text-sm">Appointments</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold mb-2">4.8★</p>
                <p className="text-indigo-100 dark:text-indigo-200 text-sm">Avg Rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

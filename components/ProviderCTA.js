import { useRouter } from 'next/router'

export default function ProviderCTA() {
  const router = useRouter()

  const benefits = [
    { icon: '💰', title: 'Earn More', description: 'Set your own rates and work flexible hours' },
    { icon: '📱', title: 'Easy Management', description: 'Manage appointments and patients effortlessly' },
    { icon: '🌟', title: 'Build Reputation', description: 'Get reviews and grow your practice online' },
    { icon: '🔒', title: 'Secure Platform', description: 'HIPAA-compliant and fully encrypted' },
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span>🩺</span>
              For Healthcare Providers
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-800 dark:text-white mb-6">
              Join as a Healthcare Provider
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Expand your practice, reach more patients, and provide quality care through our trusted platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-lg flex items-center justify-center text-2xl mb-4 mx-auto group-hover:scale-110 transition-transform">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-4">
                  Ready to grow your practice?
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Join thousands of healthcare providers who trust DoctorsHub to connect with patients and manage their practice efficiently.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-sm">✓</span>
                    Free to join and list your services
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-sm">✓</span>
                    Instant patient booking notifications
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-sm">✓</span>
                    Secure video consultations included
                  </li>
                  <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-sm">✓</span>
                    24/7 technical support
                  </li>
                </ul>
              </div>
              
              <div className="text-center lg:text-left">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-white mb-6">
                  <div className="text-3xl mb-2">🚀</div>
                  <h4 className="text-xl font-bold mb-2">Get Started Today</h4>
                  <p className="text-emerald-100 text-sm">
                    Complete verification in 24-48 hours
                  </p>
                </div>
                
                <div className="space-y-4">
                  <button
                    onClick={() => router.push('/register')}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-emerald-700 hover:to-teal-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    Join as Provider
                  </button>
                  <button
                    onClick={() => router.push('/provider-info')}
                    className="w-full border-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 px-8 py-4 rounded-xl font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                  >
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
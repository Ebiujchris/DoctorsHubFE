export default function Features() {
  const features = [
    {
      icon: '🔍',
      title: 'Smart Search',
      description: 'Find the right healthcare provider based on specialty, location, availability, and patient reviews.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: '📅',
      title: 'Easy Booking',
      description: 'Book appointments instantly with real-time availability. Get confirmation within minutes.',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      icon: '💬',
      title: 'Video Consultations',
      description: 'Secure, HIPAA-compliant video calls for remote consultations and follow-ups.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: '📱',
      title: 'Mobile Ready',
      description: 'Access your healthcare on any device. Native mobile apps coming soon.',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'Your health data is encrypted and protected with enterprise-grade security.',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: '⚡',
      title: 'Instant Notifications',
      description: 'Get real-time updates about appointments, reminders, and important health information.',
      color: 'from-yellow-500 to-orange-500'
    }
  ]

  return (
    <section className="py-20 bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span>✨</span>
            Platform Features
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-800 dark:text-white mb-6">
            Everything you need for better healthcare
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Our platform combines cutting-edge technology with human-centered design to make healthcare accessible and convenient.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-8 h-full hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800">
                <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center text-2xl text-white mb-6 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-3xl p-8 lg:p-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-4">
              Ready to experience better healthcare?
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
              Join thousands of patients who have already discovered a smarter way to manage their health.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg">
                Find a Provider
              </button>
              <button className="border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 px-8 py-4 rounded-xl font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
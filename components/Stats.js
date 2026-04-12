export default function Stats() {
  const stats = [
    { number: '10,000+', label: 'Happy Patients', icon: '👥' },
    { number: '500+', label: 'Healthcare Providers', icon: '👨‍⚕️' },
    { number: '25+', label: 'Cities Covered', icon: '🏙️' },
    { number: '24/7', label: 'Support Available', icon: '🕐' },
  ]

  return (
    <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-800 dark:to-purple-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Trusted by Thousands
          </h2>
          <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
            Join our growing community of patients and healthcare providers
          </p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl mb-3">{stat.icon}</div>
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
                {stat.number}
              </div>
              <div className="text-indigo-100 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <p className="text-indigo-200 text-sm">
            * Numbers are approximate and updated regularly
          </p>
        </div>
      </div>
    </section>
  )
}
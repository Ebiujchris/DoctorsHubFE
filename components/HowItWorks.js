export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: 'Search & Browse',
      description: 'Select your specialty and location to browse available doctors',
      icon: '🔍'
    },
    {
      number: 2,
      title: 'Choose Doctor',
      description: 'Review profiles, ratings, and experience of our healthcare professionals',
      icon: '👨‍⚕️'
    },
    {
      number: 3,
      title: 'Book Appointment',
      description: 'Select your preferred time slot and confirm your booking',
      icon: '📅'
    },
    {
      number: 4,
      title: 'Get Care',
      description: 'Connect via video call or visit the clinic for in-person care',
      icon: '💻'
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-b from-white to-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">How It Works</h2>
          <p className="text-lg text-slate-600">Book your healthcare appointment in 4 simple steps</p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {/* Connector Line (hidden on mobile) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-1/2 w-full h-1 bg-gradient-to-r from-indigo-400 to-indigo-600 transform translate-x-1/2"></div>
                )}

                {/* Step Card */}
                <div className="bg-white p-8 rounded-xl shadow-md border border-slate-100 hover:shadow-lg hover:border-indigo-200 transition-all relative z-10">
                  {/* Step Number Circle */}
                  <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {step.number}
                  </div>

                  {/* Step Icon */}
                  <div className="text-5xl text-center mb-4">{step.icon}</div>

                  {/* Step Info */}
                  <h3 className="text-xl font-semibold text-slate-800 text-center mb-2">{step.title}</h3>
                  <p className="text-slate-600 text-center text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">Why Choose DoctorsHub?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-4xl mb-2">✓</p>
                <h4 className="font-semibold text-slate-800 mb-2">Verified Doctors</h4>
                <p className="text-slate-600 text-sm">All healthcare professionals are verified and licensed</p>
              </div>
              <div className="text-center">
                <p className="text-4xl mb-2">⚡</p>
                <h4 className="font-semibold text-slate-800 mb-2">Quick Booking</h4>
                <p className="text-slate-600 text-sm">Reserve appointments in just a few clicks</p>
              </div>
              <div className="text-center">
                <p className="text-4xl mb-2">🔒</p>
                <h4 className="font-semibold text-slate-800 mb-2">Secure & Private</h4>
                <p className="text-slate-600 text-sm">Your data is encrypted and completely confidential</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'

export default function ProviderInfo() {
  const router = useRouter()

  const benefits = [
    {
      icon: '💰',
      title: 'Flexible Earnings',
      description: 'Set your own rates and work on your schedule. Earn more with premium consultations and specialized services.',
      details: ['Set competitive rates', 'Flexible scheduling', 'Multiple revenue streams', 'Performance bonuses']
    },
    {
      icon: '📱',
      title: 'Easy Management',
      description: 'Comprehensive dashboard to manage appointments, patients, and earnings all in one place.',
      details: ['Intuitive dashboard', 'Patient management', 'Automated scheduling', 'Financial tracking']
    },
    {
      icon: '🌟',
      title: 'Build Your Reputation',
      description: 'Grow your practice with patient reviews, ratings, and our marketing support.',
      details: ['Patient review system', 'Professional profile', 'Marketing support', 'Referral network']
    },
    {
      icon: '🔒',
      title: 'Secure & Compliant',
      description: 'HIPAA-compliant platform with enterprise-grade security for you and your patients.',
      details: ['HIPAA compliance', 'End-to-end encryption', 'Secure video calls', 'Data protection']
    }
  ]

  const steps = [
    {
      step: '1',
      title: 'Apply Online',
      description: 'Complete our simple application form with your professional details and credentials.',
      time: '5 minutes'
    },
    {
      step: '2',
      title: 'Verification',
      description: 'We verify your license, credentials, and background to ensure patient safety.',
      time: '24-48 hours'
    },
    {
      step: '3',
      title: 'Profile Setup',
      description: 'Create your professional profile, set your availability, and upload your photo.',
      time: '10 minutes'
    },
    {
      step: '4',
      title: 'Start Practicing',
      description: 'Begin accepting patients and providing consultations through our platform.',
      time: 'Immediate'
    }
  ]

  const faqs = [
    {
      question: 'What are the requirements to join?',
      answer: 'You must be a licensed healthcare provider (MD, DO, NP, PA, RN, etc.) with an active license in good standing. We also require malpractice insurance and completion of our background check.'
    },
    {
      question: 'How much does it cost to join?',
      answer: 'Joining DoctorsHub is completely free. We only take a small percentage of your earnings when you successfully complete consultations with patients.'
    },
    {
      question: 'How do I get paid?',
      answer: 'Payments are processed weekly via direct deposit. You can track your earnings in real-time through your provider dashboard.'
    },
    {
      question: 'Can I set my own schedule?',
      answer: 'Absolutely! You have complete control over your availability. Set your hours, block time off, and update your schedule anytime.'
    },
    {
      question: 'What support do you provide?',
      answer: 'We offer 24/7 technical support, marketing assistance, patient acquisition support, and ongoing training to help you succeed on our platform.'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 to-teal-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              Join DoctorsHub as a Healthcare Provider
            </h1>
            <p className="text-xl sm:text-2xl text-emerald-100 mb-8 leading-relaxed">
              Expand your practice, reach more patients, and provide quality care through our trusted telehealth platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/register')}
                className="bg-white text-emerald-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-emerald-50 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                Apply Now - It's Free
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all duration-200">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white mb-6">
              Why Healthcare Providers Choose DoctorsHub
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Join thousands of healthcare providers who have grown their practice with our platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-8">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">
                      {benefit.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      {benefit.description}
                    </p>
                    <ul className="space-y-2">
                      {benefit.details.map((detail, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <span className="w-4 h-4 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-xs">✓</span>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white mb-6">
              Getting Started is Simple
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              From application to your first patient in just a few days
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mb-4 mx-auto">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">
                    {step.description}
                  </p>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {step.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white mb-6">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                Everything you need to know about joining DoctorsHub
              </p>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Transform Your Practice?
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Join thousands of healthcare providers who trust DoctorsHub to grow their practice and provide better patient care.
          </p>
          <button
            onClick={() => router.push('/register')}
            className="bg-white text-emerald-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-emerald-50 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            Start Your Application Today
          </button>
        </div>
      </section>
    </div>
  )
}
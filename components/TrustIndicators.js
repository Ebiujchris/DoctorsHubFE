export default function TrustIndicators() {
  const certifications = [
    { name: 'HIPAA Compliant', icon: '🔒', description: 'Your data is protected' },
    { name: 'SSL Encrypted', icon: '🛡️', description: 'Secure connections' },
    { name: '24/7 Support', icon: '🕐', description: 'Always here to help' },
    { name: 'Verified Providers', icon: '✅', description: 'Licensed professionals only' },
  ]

  const partners = [
    { name: 'Medical Board Certified', logo: '🏥' },
    { name: 'Healthcare Alliance', logo: '🤝' },
    { name: 'Digital Health Coalition', logo: '💻' },
    { name: 'Patient Safety Network', logo: '🛡️' },
  ]

  return (
    <section className="py-16 bg-slate-50 dark:bg-slate-800/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust Badges */}
        <div className="text-center mb-12">
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-8">
            Trusted by patients and healthcare providers nationwide
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {certifications.map((cert, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center text-2xl mb-3 mx-auto group-hover:shadow-md transition-shadow">
                  {cert.icon}
                </div>
                <h4 className="font-semibold text-slate-800 dark:text-white text-sm mb-1">
                  {cert.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {cert.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Partners */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-12">
          <h4 className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 mb-8">
            Partnered with leading healthcare organizations
          </h4>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {partners.map((partner, index) => (
              <div key={index} className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <span className="text-xl">{partner.logo}</span>
                <span className="text-sm font-medium">{partner.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-12 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
              🔐
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-white mb-2">
                Your Privacy is Our Priority
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                We use bank-level encryption to protect your personal health information. All data is stored securely and never shared without your explicit consent. Our platform is fully HIPAA compliant and regularly audited for security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
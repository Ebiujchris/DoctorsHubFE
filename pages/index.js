import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Stats from '../components/Stats'
import Specialties from '../components/Specialties'
import FeaturedDoctors from '../components/FeaturedDoctors'
import ProviderCTA from '../components/ProviderCTA'
import Testimonials from '../components/Testimonials'

export default function Home(){
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Specialties />
        <FeaturedDoctors />
        <ProviderCTA />
        <Testimonials />
      </main>

      {/* Streamlined Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-900 dark:bg-slate-950 text-slate-300">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="text-white font-bold text-xl mb-4">DoctorsHub</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Connecting patients with qualified healthcare providers through secure digital health solutions.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition text-sm">
                  📘
                </a>
                <a href="#" className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition text-sm">
                  🐦
                </a>
                <a href="#" className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition text-sm">
                  📷
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Find a Doctor</a></li>
                <li><a href="#" className="hover:text-white transition">Book Appointment</a></li>
                <li><a href="#" className="hover:text-white transition">Join as Provider</a></li>
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4">Legal & Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition">HIPAA Compliance</a></li>
                <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} DoctorsHub. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                🔒 HIPAA Compliant
              </span>
              <span className="flex items-center gap-1">
                🛡️ SSL Encrypted
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

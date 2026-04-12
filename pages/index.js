import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Stats from '../components/Stats'
import Features from '../components/Features'
import Specialties from '../components/Specialties'
import FeaturedDoctors from '../components/FeaturedDoctors'
import ProviderCTA from '../components/ProviderCTA'
import HowItWorks from '../components/HowItWorks'
import Testimonials from '../components/Testimonials'
import TrustIndicators from '../components/TrustIndicators'
import CTASection from '../components/CTASection'

export default function Home(){
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <Specialties />
        <FeaturedDoctors />
        <ProviderCTA />
        <HowItWorks />
        <Testimonials />
        <TrustIndicators />
        <CTASection />
      </main>

      {/* Enhanced Footer */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900 dark:bg-slate-950 text-slate-300">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <h3 className="text-white font-bold text-xl mb-4">DoctorsHub</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Connecting patients with qualified healthcare providers through secure, convenient, and affordable digital health solutions.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition">
                  📘
                </a>
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition">
                  🐦
                </a>
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition">
                  📷
                </a>
              </div>
            </div>

            {/* For Patients */}
            <div>
              <h4 className="text-white font-semibold mb-4">For Patients</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition">Find a Doctor</a></li>
                <li><a href="#" className="hover:text-white transition">Book Appointment</a></li>
                <li><a href="#" className="hover:text-white transition">Video Consultation</a></li>
                <li><a href="#" className="hover:text-white transition">Health Records</a></li>
                <li><a href="#" className="hover:text-white transition">Prescription Refills</a></li>
              </ul>
            </div>

            {/* For Providers */}
            <div>
              <h4 className="text-white font-semibold mb-4">For Providers</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition">Join as Provider</a></li>
                <li><a href="#" className="hover:text-white transition">Provider Dashboard</a></li>
                <li><a href="#" className="hover:text-white transition">Manage Appointments</a></li>
                <li><a href="#" className="hover:text-white transition">Telehealth Tools</a></li>
                <li><a href="#" className="hover:text-white transition">Provider Support</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Press</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-slate-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-wrap gap-6 text-sm">
                <a href="#" className="hover:text-white transition">Privacy Policy</a>
                <a href="#" className="hover:text-white transition">Terms of Service</a>
                <a href="#" className="hover:text-white transition">HIPAA Compliance</a>
                <a href="#" className="hover:text-white transition">Accessibility</a>
              </div>
              <p className="text-sm text-slate-500">
                © {new Date().getFullYear()} DoctorsHub. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

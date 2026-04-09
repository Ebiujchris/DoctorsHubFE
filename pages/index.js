import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Specialties from '../components/Specialties'
import FeaturedDoctors from '../components/FeaturedDoctors'
import HowItWorks from '../components/HowItWorks'
import Testimonials from '../components/Testimonials'
import CTASection from '../components/CTASection'

export default function Home(){
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      <Navbar />
      <main>
        <Hero />
        <Specialties />
        <FeaturedDoctors />
        <HowItWorks />
        <Testimonials />
        <CTASection />
      </main>

      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-slate-200 dark:bg-slate-950 text-slate-600 dark:text-slate-300 text-center border-t border-slate-300 dark:border-slate-800">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-6">
            <h3 className="text-slate-800 dark:text-white font-semibold mb-2">DoctorsHub</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Trusted healthcare booking platform connecting patients with qualified professionals.</p>
          </div>
          <div className="flex justify-center gap-6 mb-6 text-sm">
            <a href="#" className="hover:text-slate-800 dark:hover:text-white transition">About</a>
            <a href="#" className="hover:text-slate-800 dark:hover:text-white transition">Terms</a>
            <a href="#" className="hover:text-slate-800 dark:hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-slate-800 dark:hover:text-white transition">Contact</a>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500"> © {new Date().getFullYear()} DoctorsHub — Trusted care for everyone.</p>
        </div>
      </footer>
    </div>
  )
}

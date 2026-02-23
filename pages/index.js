import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Services from '../components/Services'
import About from '../components/About'
import Contact from '../components/Contact'

export default function Home(){
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <About />
        <Contact />
      </main>

      <footer className="py-6 text-center text-sm text-slate-600">
        © {new Date().getFullYear()} DoctorsHub — Trusted care for everyone.
      </footer>
    </div>
  )
}

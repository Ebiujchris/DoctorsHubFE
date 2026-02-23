import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Navbar(){
  const router = useRouter()
  const isHome = router.pathname === '/'

  const handleNavClick = (e, hash) => {
    if(isHome){
      // On home page, scroll to section
      e.preventDefault()
      const element = document.querySelector(hash)
      element?.scrollIntoView({ behavior: 'smooth' })
    } else {
      // On other pages, navigate to home with hash
      e.preventDefault()
      router.push(`/${hash}`)
    }
  }

  return (
    <nav className="w-full px-6 py-4 flex items-center justify-between bg-white/60 backdrop-blur sticky top-0 z-40">
      <Link href="/" className="flex items-center gap-3 cursor-pointer">
        <div className="h-10 w-10 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">DH</div>
        <div className="font-semibold text-lg">DoctorsHub</div>
      </Link>
      <div className="hidden md:flex items-center gap-6 text-slate-700">
        <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="cursor-pointer hover:text-indigo-600">Home</a>
        <a href="#about" onClick={(e) => handleNavClick(e, '#about')} className="cursor-pointer hover:text-indigo-600">About Us</a>
        <a href="#services" onClick={(e) => handleNavClick(e, '#services')} className="cursor-pointer hover:text-indigo-600">Services</a>
        <a href="#contact" onClick={(e) => handleNavClick(e, '#contact')} className="cursor-pointer hover:text-indigo-600">Contact</a>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/register" className="text-sm px-3 py-1 rounded hover:bg-slate-100">Register</Link>
        <Link href="/login" className="text-sm px-3 py-1 rounded border">Login</Link>
        <a href="#book" className="ml-2 bg-indigo-600 text-white px-4 py-2 rounded">Book Appointment</a>
      </div>
    </nav>
  )
}

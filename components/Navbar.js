import Link from 'next/link'

export default function Navbar(){
  return (
    <nav className="w-full px-6 py-4 flex items-center justify-between bg-white/60 backdrop-blur sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">DH</div>
        <div className="font-semibold text-lg">DoctorsHub</div>
      </div>
      <div className="hidden md:flex items-center gap-6 text-slate-700">
        <a href="#home" className="cursor-pointer hover:text-indigo-600">Home</a>
        <a href="#about" className="cursor-pointer hover:text-indigo-600">About Us</a>
        <a href="#services" className="cursor-pointer hover:text-indigo-600">Services</a>
        <a href="#contact" className="cursor-pointer hover:text-indigo-600">Contact</a>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/register" className="text-sm px-3 py-1 rounded hover:bg-slate-100">Register</Link>
        <Link href="/login" className="text-sm px-3 py-1 rounded border">Login</Link>
        <a href="#book" className="ml-2 bg-indigo-600 text-white px-4 py-2 rounded">Book Appointment</a>
      </div>
    </nav>
  )
}

import { useState } from 'react'
import SearchBar from './SearchBar'

export default function Hero(){
  const [role,setRole] = useState('Patient')
  return (
    <section id="home" className="hero-bg min-h-[80vh] sm:min-h-[90vh] flex items-center py-16 sm:py-20 relative">
      {/* Responsive overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/40 to-slate-900/10 dark:from-slate-900/70 dark:to-slate-900/30"></div>
      
      <div className="container mx-auto px-4 sm:px-6 xl:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Heading */}
          <div className="max-w-3xl sm:max-w-4xl lg:max-w-2xl text-white mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4">Care when you need it — online or in-person</h1>
            <p className="mt-4 text-base sm:text-lg text-slate-100/90">Book consultations with doctors, nurses or carers. Easy scheduling, secure video calls and local clinic bookings.</p>
          </div>

          {/* Search Bar */}
          <SearchBar />

          {/* Quick Info */}
          <div className="mt-8 flex flex-col sm:flex-row gap-6 text-white text-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✓</span>
              <span>Verified Doctors</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span>Quick Booking</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔒</span>
              <span>Secure & Private</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

import { useState } from 'react'
import { useRouter } from 'next/router'
import SearchBar from './SearchBar'

export default function Hero(){
  const router = useRouter()
  const [role,setRole] = useState('Patient')
  
  return (
    <section id="home" className="hero-bg min-h-[85vh] sm:min-h-[95vh] flex items-center py-16 sm:py-20 relative overflow-hidden">
      {/* Enhanced overlay with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-indigo-900/30 to-purple-900/40 dark:from-slate-900/80 dark:via-indigo-900/50 dark:to-purple-900/60"></div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 xl:px-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Enhanced Heading */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              Trusted by 50,000+ patients nationwide
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 text-white">
              Healthcare
              <span className="block bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-slate-100/90 max-w-3xl mx-auto leading-relaxed mb-8">
              Connect with verified healthcare providers instantly. Book appointments, get consultations, and manage your health — all in one place.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button 
                onClick={() => router.push('/register')}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-emerald-600 hover:to-cyan-600 transform hover:scale-105 transition-all duration-200 shadow-xl"
              >
                Find a Provider
              </button>
              <button 
                onClick={() => router.push('/register')}
                className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all duration-200"
              >
                Join as Provider
              </button>
            </div>
          </div>

          {/* Enhanced Search Bar */}
          <div className="mb-12">
            <SearchBar />
          </div>

          {/* Enhanced Quick Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-white">
            <div className="flex items-center justify-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-2xl">
                ✓
              </div>
              <div>
                <div className="font-semibold">Verified Providers</div>
                <div className="text-sm text-slate-200">Licensed & background checked</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center text-2xl">
                ⚡
              </div>
              <div>
                <div className="font-semibold">Instant Booking</div>
                <div className="text-sm text-slate-200">Same-day appointments available</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-2xl">
                🔒
              </div>
              <div>
                <div className="font-semibold">HIPAA Secure</div>
                <div className="text-sm text-slate-200">Your privacy protected</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

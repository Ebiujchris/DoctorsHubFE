import { useState } from 'react'

export default function Hero(){
  const [role,setRole] = useState('Patient')
  return (
    <section id="home" className="hero-bg min-h-[72vh] flex items-center">
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl text-white">
          <h1 className="text-4xl md:text-5xl font-bold">Care when you need it — online or in-person</h1>
          <p className="mt-4 text-lg text-slate-100/90">Book consultations with doctors, nurses or carers. Easy scheduling, secure video calls and local clinic bookings.</p>

          <div className="mt-6 bg-white/10 p-4 rounded-lg glass">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <select value={role} onChange={(e)=>setRole(e.target.value)} className="px-3 py-2 rounded bg-white/20 text-white">
                <option>Patient</option>
                <option>Doctor</option>
                <option>Psychiatrist</option>
                <option>Nurse</option>
                <option>Carer</option>
              </select>

              <input type="date" className="px-3 py-2 rounded bg-white/20 text-white" />

              <select className="px-3 py-2 rounded bg-white/20 text-white">
                <option>Online Consultation</option>
                <option>Mental Health Consultation</option>
                <option>Clinic - Central</option>
                <option>Clinic - South</option>
                <option>At-home Visit</option>
              </select>

              <button id="book" className="ml-auto bg-indigo-600 px-4 py-2 rounded text-white">Book Appointment</button>
            </div>
            <div className="mt-2 text-sm text-white/80">Selected role: <strong>{role}</strong></div>
          </div>
        </div>
      </div>
    </section>
  )
}

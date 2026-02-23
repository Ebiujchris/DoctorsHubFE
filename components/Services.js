export default function Services(){
  const items = [
    {title:'Online Consultation', desc:'Secure video calls with licensed clinicians.', icon:'🎥'},
    {title:'Mental Health Consultation', desc:'Speak with psychiatrists & therapists online.', icon:'🧠'},
    {title:'In-Clinic Booking', desc:'Book time slots at nearby clinics.', icon:'🏥'},
    {title:'Home Nursing', desc:'Qualified nurses for home visits.', icon:'🏠'},
    {title:'Carer Matching', desc:'Connect with vetted carers for ongoing support.', icon:'👥'}
  ]
  return (
    <section id="services" className="py-16 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-semibold mb-12 text-center text-slate-800">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 max-w-6xl mx-auto">
          {items.map((it)=> (
            <div key={it.title} className="p-6 border border-slate-200 rounded-lg hover:shadow-md hover:border-indigo-300 transition-all duration-300 text-center">
              <div className="text-5xl mb-4">{it.icon}</div>
              <h3 className="font-semibold mb-3 text-slate-800">{it.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

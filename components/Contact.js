export default function Contact(){
  return (
    <section id="contact" className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
        <h2 className="text-2xl sm:text-3xl font-semibold mb-4">Contact</h2>
        <form className="grid grid-cols-1 gap-4">
          <input placeholder="Your name" className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          <input placeholder="Email" className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          <textarea placeholder="Message" className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-300" rows="4" />
          <button className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition">Send</button>
        </form>
      </div>
    </section>
  )
}

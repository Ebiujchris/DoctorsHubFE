export default function Contact(){
  return (
    <section id="contact" className="py-16 bg-white">
      <div className="container mx-auto px-6 max-w-2xl">
        <h2 className="text-2xl font-semibold mb-4">Contact</h2>
        <form className="grid grid-cols-1 gap-3">
          <input placeholder="Your name" className="px-3 py-2 border rounded" />
          <input placeholder="Email" className="px-3 py-2 border rounded" />
          <textarea placeholder="Message" className="px-3 py-2 border rounded" rows="4" />
          <button className="self-start bg-indigo-600 text-white px-4 py-2 rounded">Send</button>
        </form>
      </div>
    </section>
  )
}

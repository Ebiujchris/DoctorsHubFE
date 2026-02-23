// dummy registration endpoint
// expects POST with JSON body matching:
// { email, password, firstName, lastName, phone, role }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.setHeader('Allow', ['POST']).status(405).json({ message: 'Method not allowed' })
  }

  const { email, password, firstName, lastName, phone, role } = req.body || {}

  // basic validation
  if (!email || !password || !firstName || !lastName || !phone || !role) {
    return res.status(400).json({ message: 'Missing required field(s)' })
  }

  // TODO: integrate with database / auth service
  console.log('Register request received:', { email, firstName, lastName, phone, role })

  // simulate user creation and persist to memory store
  const { addUser } = await import('../../../data/users')
  const user = addUser({
    id: Date.now(),
    email,
    password, // store for login (plaintext unfortunate but fine for dummy)
    firstName,
    lastName,
    phone,
    role,
  })

  // send success response including stored user metadata (sans password)
  const { password: _pwd, ...safeUser } = user
  res.status(201).json({ message: 'User registered', user: safeUser })
}

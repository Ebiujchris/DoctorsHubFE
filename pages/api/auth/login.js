// dummy login endpoint
// expects POST with JSON body { email, password }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.setHeader('Allow', ['POST']).status(405).json({ message: 'Method not allowed' })
  }

  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' })
  }

  console.log('Login attempt:', email)

  const { findUserByEmail } = await import('../../../data/users')
  const user = findUserByEmail(email)
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  // return user information (omit password) along with fake token
  const { password: _pwd, ...safeUser } = user
  res.status(200).json({ message: 'Login successful', token: 'fake-jwt-token', user: safeUser })
}

// simple auth helper for frontend
//const API_URL = 'http://localhost:3001'
const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function register(data) {
  // backend validation schema does **not** expect confirmPassword,
  // so we strip it before sending. data should include firstName,
  // lastName, email, phone, password, role.
  const payload = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    password: data.password,
    role: data.role,
  }

  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || 'Registration failed')
  }

  return res.json()
}

export async function login(credentials) {
  // credentials: { email, password }
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })

  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || 'Login failed')
  }

  const data = await res.json()
  if (data.user) {
    setCurrentUser(data.user)
  }
  return data
}

// helpers for persistence and retrieval of current user
export function setCurrentUser(user) {
  try {
    localStorage.setItem('dh_user', JSON.stringify(user))
  } catch(e) {
    console.warn('failed to persist user', e)
  }
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem('dh_user')
    return raw ? JSON.parse(raw) : null
  } catch(e) {
    console.warn('failed to read user', e)
    return null
  }
}

export function logout() {
  localStorage.removeItem('dh_user')
}

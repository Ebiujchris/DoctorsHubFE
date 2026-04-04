// simple auth helper for frontend
//const API_URL = 'http://localhost:3001'
const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function register(data) {
  // backend validation schema does **not** expect confirmPassword,
  // so we strip it before sending. data should include firstName,
  // lastName, email, phone, password, role, and specialty (optional).
  const payload = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    password: data.password,
    role: data.role,
  }
  
  // Add specialty if provided (for healthcare providers)
  if (data.specialty) {
    payload.specialty = data.specialty
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
  console.log('🔐 Login response received:', { hasUser: !!data.user, hasToken: !!data.access_token })
  if (data.user) {
    setCurrentUser(data.user)
    console.log('🔐 User stored:', data.user.email)
    if (data.access_token) {
      setAuthToken(data.access_token)
      console.log('🔐 Token stored successfully, length:', data.access_token.length)
      console.log('🔐 Token verification - getAuthToken() returns:', !!getAuthToken())
    } else {
      console.warn('⚠️ No access_token in response')
    }
  } else {
    console.warn('⚠️ No user in response')
  }
  return data
}

export async function googleLogin(idToken) {
  // idToken: Google OAuth ID token from frontend
  const res = await fetch(`${API_URL}/auth/google-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken }),
  })

  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || 'Google login failed')
  }

  const data = await res.json()
  if (data.user) {
    setCurrentUser(data.user)
    if (data.access_token) {
      setAuthToken(data.access_token)
    }
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
  localStorage.removeItem('dh_token')
}

export function setAuthToken(token) {
  try {
    localStorage.setItem('dh_token', token)
  } catch(e) {
    console.warn('failed to persist token', e)
  }
}

export function getAuthToken() {
  try {
    return localStorage.getItem('dh_token')
  } catch(e) {
    console.warn('failed to read token', e)
    return null
  }
}

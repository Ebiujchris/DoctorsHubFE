// API service for backend calls

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Fetch popular specialties - can be hardcoded or fetched from backend
export const fetchSpecialties = async () => {
  try {
    return [
      { id: 1, name: 'General Practitioner', icon: '🩺', count: 324 },
      { id: 2, name: 'Cardiologist', icon: '❤️', count: 187 },
      { id: 3, name: 'Psychiatrist', icon: '🧠', count: 256 },
      { id: 4, name: 'Dentist', icon: '🦷', count: 412 },
      { id: 5, name: 'Nurse', icon: '💉', count: 289 },
      { id: 6, name: 'Home Carer', icon: '🏠', count: 156 }
    ]
  } catch (error) {
    console.error('Error fetching specialties:', error)
    throw error
  }
}

// Fetch featured doctors from backend
export const fetchFeaturedDoctors = async () => {
  try {
    const response = await fetch(`${API_BASE}/users/featured/doctors`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const doctors = await response.json()
    
    // Transform backend data to match frontend expectations
    return doctors.map(doc => ({
      id: doc.id,
      name: `${doc.firstName} ${doc.lastName}`,
      specialty: doc.specialty || 'Doctor',
      rating: doc.rating || 4.8,
      reviews: doc.reviews || 0,
      image: doc.profilePicture || `https://i.pravatar.cc/150?img=${Math.random() * 50}`,
      experience: doc.experience || 'N/A',
      responseTime: doc.responseTime || '< 2 hours',
      fees: doc.fees || null
    }))
  } catch (error) {
    console.error('Error fetching featured doctors:', error)
    // Fallback to mock data if backend is unavailable
    return []
  }
}

// Fetch featured nurses from backend
export const fetchFeaturedNurses = async () => {
  try {
    const response = await fetch(`${API_BASE}/users/featured/nurses`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const nurses = await response.json()
    
    return nurses.map(nurse => ({
      id: nurse.id,
      name: `${nurse.firstName} ${nurse.lastName}`,
      specialty: 'Nurse',
      rating: nurse.rating || 4.8,
      reviews: nurse.reviews || 0,
      image: nurse.profilePicture || `https://i.pravatar.cc/150?img=${Math.random() * 50}`,
      experience: nurse.experience || 'N/A',
      responseTime: nurse.responseTime || '< 2 hours',
      fees: nurse.fees || null
    }))
  } catch (error) {
    console.error('Error fetching featured nurses:', error)
    return []
  }
}

// Fetch featured carers from backend
export const fetchFeaturedCarers = async () => {
  try {
    const response = await fetch(`${API_BASE}/users/featured/carers`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const carers = await response.json()
    
    return carers.map(carer => ({
      id: carer.id,
      name: `${carer.firstName} ${carer.lastName}`,
      specialty: 'Home Carer',
      rating: carer.rating || 4.8,
      reviews: carer.reviews || 0,
      image: carer.profilePicture || `https://i.pravatar.cc/150?img=${Math.random() * 50}`,
      experience: carer.experience || 'N/A',
      responseTime: carer.responseTime || '< 2 hours',
      fees: carer.fees || null
    }))
  } catch (error) {
    console.error('Error fetching featured carers:', error)
    return []
  }
}

// Fetch featured psychiatrists from backend
export const fetchFeaturedPsychiatrists = async () => {
  try {
    const response = await fetch(`${API_BASE}/users/featured/psychiatrists`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const psychiatrists = await response.json()
    
    return psychiatrists.map(psychiatrist => ({
      id: psychiatrist.id,
      name: `${psychiatrist.firstName} ${psychiatrist.lastName}`,
      specialty: psychiatrist.specialty || 'Psychiatrist',
      rating: psychiatrist.rating || 4.8,
      reviews: psychiatrist.reviews || 0,
      image: psychiatrist.profilePicture || `https://i.pravatar.cc/150?img=${Math.random() * 50}`,
      experience: psychiatrist.experience || 'N/A',
      responseTime: psychiatrist.responseTime || '< 2 hours',
      fees: psychiatrist.fees || null
    }))
  } catch (error) {
    console.error('Error fetching featured psychiatrists:', error)
    return []
  }
}

// Get all featured healthcare providers (doctors, nurses, psychiatrists, carers)
export const fetchFeaturedDoctors_Combined = async () => {
  try {
    const [doctors, nurses, psychiatrists, carers] = await Promise.all([
      fetchFeaturedDoctors(),
      fetchFeaturedNurses(),
      fetchFeaturedPsychiatrists(),
      fetchFeaturedCarers()
    ])
    
    // Return all providers, mixed types
    return [...doctors, ...nurses, ...psychiatrists, ...carers]
  } catch (error) {
    console.error('Error fetching featured providers:', error)
    return []
  }
}

// Search doctors/nurses/carers by specialty
export const searchDoctors = async (specialty) => {
  try {
    if (!specialty) {
      throw new Error('Specialty is required')
    }

    // Build query string
    const params = new URLSearchParams()
    params.append('specialty', specialty)

    const response = await fetch(`${API_BASE}/users/search?${params.toString()}`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const providers = await response.json()

    // Transform backend data
    return providers.map(provider => ({
      id: provider.id,
      name: `${provider.firstName} ${provider.lastName}`,
      specialty: provider.specialty || provider.role,
      rating: provider.rating || 4.8,
      reviews: provider.reviews || 0,
      image: provider.profilePicture || `https://i.pravatar.cc/150?img=${Math.random() * 50}`,
      experience: provider.experience || 'N/A',
      responseTime: provider.responseTime || '< 2 hours'
    }))
  } catch (error) {
    console.error('Error searching providers:', error)
    throw error
  }
}

// Fetch nearby clinics (for future map implementation)
export const fetchNearbyClinics = async (location) => {
  try {
    // Mock data for now - can be replaced with real clinic API
    return [
      {
        id: 1,
        name: 'Central Health Clinic',
        location: 'Downtown',
        lat: 40.7128,
        lng: -74.0060,
        distance: '0.5 km'
      },
      {
        id: 2,
        name: 'South Medical Center',
        location: 'South District',
        lat: 40.7061,
        lng: -74.0087,
        distance: '1.2 km'
      }
    ]
  } catch (error) {
    console.error('Error fetching clinics:', error)
    throw error
  }
}

// Fetch testimonials (can be from database or mock)
export const fetchTestimonials = async () => {
  try {
    return [
      {
        id: 1,
        name: 'John Smith',
        feedback: 'Excellent service! The doctor was very professional and attentive.',
        rating: 5,
        date: '2 weeks ago'
      },
      {
        id: 2,
        name: 'Maria Garcia',
        feedback: 'Quick response and very helpful. Highly recommend DoctorsHub!',
        rating: 5,
        date: '1 month ago'
      },
      {
        id: 3,
        name: 'Ahmed Hassan',
        feedback: 'Great experience overall. Will use again for sure.',
        rating: 4,
        date: '3 weeks ago'
      }
    ]
  } catch (error) {
    console.error('Error fetching testimonials:', error)
    throw error
  }
}

// Get specific provider by ID
export const fetchProviderById = async (id) => {
  try {
    const response = await fetch(`${API_BASE}/users/${id}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const provider = await response.json()
    
    return {
      id: provider.id,
      name: `${provider.firstName} ${provider.lastName}`,
      specialty: provider.specialty || provider.role,
      rating: provider.rating || 4.8,
      reviews: provider.reviews || 0,
      image: provider.profilePicture || `https://i.pravatar.cc/150?img=${Math.random() * 50}`,
      experience: provider.experience || 'N/A',
      responseTime: provider.responseTime || '< 2 hours',
      bio: provider.bio,
      phone: provider.phone,
      email: provider.email,
      isVerified: provider.isVerified
    }
  } catch (error) {
    console.error('Error fetching provider:', error)
    throw error
  }
}

// ── Notifications ──────────────────────────────────────────────────────────────

export const fetchNotifications = async (token) => {
  const res = await fetch(`${API_BASE}/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch notifications')
  return res.json()
}

export const fetchUnreadCount = async (token) => {
  const res = await fetch(`${API_BASE}/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return { count: 0 }
  return res.json()
}

export const markNotificationRead = async (id, token) => {
  await fetch(`${API_BASE}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export const markAllNotificationsRead = async (token) => {
  await fetch(`${API_BASE}/notifications/mark-all-read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export const cancelBooking = async (bookingId, token) => {
  const res = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to cancel booking')
  return res.json()
}

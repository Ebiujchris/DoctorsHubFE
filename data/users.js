// simple in-memory store for dummy auth endpoints
const users = []

export function addUser(user) {
  users.push(user)
  return user
}

export function findUserByEmail(email) {
  return users.find(u => u.email === email)
}

export default users

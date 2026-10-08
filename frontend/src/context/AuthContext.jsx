import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Auth state survives a page refresh because tokens live in localStorage.
  const [accessToken, setAccessToken] = useState(
    () => localStorage.getItem('access')
  )
  const [username, setUsername] = useState(
    () => localStorage.getItem('username')
  )

  const isLoggedIn = !!accessToken

  const login = (access, refresh, username) => {
    localStorage.setItem('access', access)
    localStorage.setItem('refresh', refresh)
    // The JWT only contains user_id, so keep the typed username for the UI.
    localStorage.setItem('username', username)
    setAccessToken(access)
    setUsername(username)
  }

  const logout = () => {
    // JWT logout is just deleting the tokens; the server is never called.
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('username')
    setAccessToken(null)
    setUsername(null)
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

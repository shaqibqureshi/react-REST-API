import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Gate for private pages: if there is no token, send the user to /login.
export default function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth()
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

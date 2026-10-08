import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { username, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <Link to="/dashboard">Task Manager</Link>
      <div className="navbar-right">
        <span>{username}</span>
        <Link to="/tasks/new">New Task</Link>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  )
}

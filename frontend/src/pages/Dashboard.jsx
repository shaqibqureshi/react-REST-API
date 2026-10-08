import { useCallback, useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import TaskList from '../components/TaskList'
import api from '../services/api'

export default function Dashboard() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadTasks = useCallback(async () => {
    try {
      // The axios interceptor attaches the JWT automatically.
      const { data } = await api.get('/tasks/')
      setTasks(data)
      setError('')
    } catch {
      setError('Could not load tasks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  return (
    <div>
      <Navbar />
      <main className="container">
        <h1>My Tasks</h1>
        {loading && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && <TaskList tasks={tasks} onChanged={loadTasks} />}
      </main>
    </div>
  )
}

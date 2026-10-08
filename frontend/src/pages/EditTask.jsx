import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import TaskForm from '../components/TaskForm'
import api from '../services/api'

export default function EditTask() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [task, setTask] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get(`/tasks/${id}/`)
      .then(({ data }) => setTask(data))
      // 404 means the task does not exist or belongs to someone else.
      .catch(() => setError('Task not found'))
  }, [id])

  const handleUpdate = async (values) => {
    await api.put(`/tasks/${id}/`, values)
    navigate('/dashboard')
  }

  return (
    <div>
      <Navbar />
      <main className="container">
        <h1>Edit Task</h1>
        {error && <p className="error">{error}</p>}
        {task && (
          <TaskForm
            initialTask={task}
            onSubmit={handleUpdate}
            submitLabel="Save Changes"
          />
        )}
      </main>
    </div>
  )
}

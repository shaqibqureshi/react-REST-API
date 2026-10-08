import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import TaskForm from '../components/TaskForm'
import api from '../services/api'

export default function CreateTask() {
  const navigate = useNavigate()

  const handleCreate = async (values) => {
    await api.post('/tasks/', values)
    navigate('/dashboard')
  }

  return (
    <div>
      <Navbar />
      <main className="container">
        <h1>New Task</h1>
        <TaskForm onSubmit={handleCreate} submitLabel="Create Task" />
      </main>
    </div>
  )
}

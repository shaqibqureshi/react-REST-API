import { Link } from 'react-router-dom'
import api from '../services/api'

export default function TaskItem({ task, onChanged }) {
  const handleDelete = async () => {
    if (!window.confirm(`Delete "${task.title}"?`)) return
    await api.delete(`/tasks/${task.id}/`)
    onChanged()
  }

  const handleToggle = async () => {
    await api.patch(`/tasks/${task.id}/`, { completed: !task.completed })
    onChanged()
  }

  return (
    <li className={`task-item ${task.completed ? 'done' : ''}`}>
      <label>
        <input type="checkbox" checked={task.completed} onChange={handleToggle} />
        <span className="task-title">{task.title}</span>
      </label>
      {task.description && <p className="task-desc">{task.description}</p>}
      <div className="task-actions">
        <Link to={`/tasks/${task.id}/edit`}>Edit</Link>
        <button onClick={handleDelete}>Delete</button>
      </div>
    </li>
  )
}

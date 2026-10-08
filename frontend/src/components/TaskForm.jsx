import { useState } from 'react'

export default function TaskForm({ initialTask = {}, onSubmit, submitLabel }) {
  const [title, setTitle] = useState(initialTask.title || '')
  const [description, setDescription] = useState(initialTask.description || '')
  const [completed, setCompleted] = useState(initialTask.completed || false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    setError('')
    await onSubmit({ title, description, completed })
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <label>
        Title
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
        />
      </label>
      <label>
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          rows="4"
        />
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={completed}
          onChange={(e) => setCompleted(e.target.checked)}
        />
        Completed
      </label>
      {error && <p className="error">{error}</p>}
      <button type="submit">{submitLabel}</button>
    </form>
  )
}

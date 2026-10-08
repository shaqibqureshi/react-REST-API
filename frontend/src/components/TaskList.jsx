import TaskItem from './TaskItem'

export default function TaskList({ tasks, onChanged }) {
  if (tasks.length === 0) {
    return <p>No tasks yet. Create one!</p>
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onChanged={onChanged} />
      ))}
    </ul>
  )
}

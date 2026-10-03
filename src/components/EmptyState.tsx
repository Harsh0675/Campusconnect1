import { type ReactNode } from 'react'
import { Inbox } from 'lucide-react'

type EmptyStateProps = {
  title: string
  message: string
  action?: ReactNode
}

export default function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <Inbox />
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  )
}

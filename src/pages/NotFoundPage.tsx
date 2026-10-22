import { Link } from 'react-router'
import { EmptyState, PageHeader } from '../components/misc'

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Seite nicht gefunden" />
      <EmptyState title="Diese Seite gibt es nicht.">
        <Link to="/" className="text-accent underline">
          Zur Startseite
        </Link>
      </EmptyState>
    </>
  )
}

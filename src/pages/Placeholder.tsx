import { PageHeader, EmptyState } from '../components/misc'

export function Placeholder({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState title="Kommt in einer der nächsten Etappen." />
    </>
  )
}

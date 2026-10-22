import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { Card, PageHeader } from '../components/misc'
import { NAV_ITEMS } from '../layout/nav'

const HIDDEN_ON_MOBILE_MORE = ['/eingang', '/jetzt', '/projekte']

/** „Mehr“-Seite der unteren Leiste am Handy */
export function MorePage() {
  return (
    <>
      <PageHeader title="Mehr" />
      <Card className="divide-y divide-line overflow-hidden">
        {NAV_ITEMS.filter((item) => !HIDDEN_ON_MOBILE_MORE.includes(item.to)).map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex min-h-13 items-center gap-3 px-4 hover:bg-surface-2">
            <Icon size={20} strokeWidth={1.8} className="text-ink-muted" />
            <span className="flex-1">{label}</span>
            <ChevronRight size={18} className="text-ink-muted" />
          </Link>
        ))}
      </Card>
    </>
  )
}

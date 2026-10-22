import { Ellipsis, FolderKanban, Inbox, Plus, Zap } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router'
import { CountBadge } from '../components/misc'
import { useData } from '../data/hooks'
import { visibleInbox } from '../domain/tickler'
import { useCapture } from '../state/feedback'
import { useToday } from '../state/useToday'
import { AreaFilterControl } from './AreaFilterControl'
import { NAV_ITEMS } from './nav'

function useInboxCount() {
  const { inbox } = useData()
  return visibleInbox(inbox, useToday()).length
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <img src="/favicon.svg" alt="" className="size-7" />
      <span>GTD</span>
    </Link>
  )
}

function Sidebar() {
  const inboxCount = useInboxCount()
  const { openCapture } = useCapture()
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface md:flex">
      <div className="px-5 pt-5 pb-4">
        <Logo />
      </div>
      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={openCapture}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl bg-accent px-3 font-medium text-on-accent transition hover:brightness-110"
        >
          <Plus size={20} />
          <span className="flex-1 text-left">Erfassen</span>
          <kbd className="rounded-md bg-white/20 px-1.5 text-xs font-semibold">N</kbd>
        </button>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4" aria-label="Hauptnavigation">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex min-h-10 items-center gap-3 rounded-xl px-3 text-[15px] transition ${
                isActive ? 'bg-accent-soft font-medium text-accent' : 'text-ink hover:bg-surface-2'
              }`
            }
          >
            <Icon size={18} strokeWidth={1.8} />
            <span className="flex-1">{label}</span>
            {to === '/eingang' && <CountBadge count={inboxCount} />}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

const BOTTOM_ITEMS = [
  { to: '/eingang', label: 'Eingang', icon: Inbox },
  { to: '/jetzt', label: 'Jetzt', icon: Zap },
  { to: '/projekte', label: 'Projekte', icon: FolderKanban },
  { to: '/mehr', label: 'Mehr', icon: Ellipsis },
]

function BottomNav() {
  const inboxCount = useInboxCount()
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Hauptnavigation"
    >
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {BOTTOM_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs ${
                isActive ? 'font-semibold text-accent' : 'text-ink-muted'
              }`
            }
          >
            <span className="relative">
              <Icon size={22} strokeWidth={1.8} />
              {to === '/eingang' && <CountBadge count={inboxCount} className="absolute -top-1.5 left-4" />}
            </span>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function TopBar() {
  return (
    <div className="sticky top-0 z-20 border-b border-line bg-canvas/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4 md:justify-end md:px-8">
        <div className="flex-1 md:hidden">
          <Logo />
        </div>
        <AreaFilterControl />
      </div>
    </div>
  )
}

export function AppShell() {
  return (
    <div className="min-h-dvh md:flex">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-5 pb-36 md:px-8 md:pb-16">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}

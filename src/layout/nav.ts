import {
  BookOpen,
  CalendarDays,
  FolderKanban,
  Hourglass,
  House,
  Inbox,
  Lightbulb,
  ListChecks,
  RotateCcw,
  Settings,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Start', icon: House },
  { to: '/eingang', label: 'Eingang', icon: Inbox },
  { to: '/jetzt', label: 'Jetzt', icon: Zap },
  { to: '/naechste-schritte', label: 'Nächste Schritte', icon: ListChecks },
  { to: '/projekte', label: 'Projekte', icon: FolderKanban },
  { to: '/warten', label: 'Warten auf', icon: Hourglass },
  { to: '/agenden', label: 'Agenden', icon: Users },
  { to: '/kalender', label: 'Kalender', icon: CalendarDays },
  { to: '/irgendwann', label: 'Irgendwann/Vielleicht', icon: Lightbulb },
  { to: '/referenz', label: 'Referenz', icon: BookOpen },
  { to: '/rueckblick', label: 'Wochenrückblick', icon: RotateCcw },
  { to: '/einstellungen', label: 'Einstellungen', icon: Settings },
]

import type { ReactNode } from 'react'
import type { Area } from '../data/types'
import { AREA_LABEL } from './labels'

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-end gap-3">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </header>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-surface ${className}`}>{children}</div>
}

export function SectionTitle({ children, count, tone }: { children: ReactNode; count?: number; tone?: 'danger' }) {
  return (
    <h2
      className={`mt-6 mb-2 flex items-center gap-2 px-1 text-sm font-semibold tracking-wide uppercase ${
        tone === 'danger' ? 'text-danger' : 'text-ink-muted'
      }`}
    >
      {children}
      {count !== undefined && <span className="font-normal normal-case">({count})</span>}
    </h2>
  )
}

export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-10 text-center">
      {icon && <div className="mx-auto mb-3 flex justify-center text-ink-muted">{icon}</div>}
      <p className="font-medium">{title}</p>
      {children && <div className="mt-1 text-ink-muted">{children}</div>}
    </div>
  )
}

export function AreaBadge({ area }: { area: Area }) {
  const style = area === 'arbeit' ? 'bg-arbeit-soft text-arbeit' : 'bg-privat-soft text-privat'
  return <span className={`inline-flex rounded-md px-1.5 py-0.5 text-xs font-medium ${style}`}>{AREA_LABEL[area]}</span>
}

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'danger' | 'warn' | 'ok' | 'accent' }) {
  const tones = {
    neutral: 'bg-surface-2 text-ink-muted',
    danger: 'bg-danger-soft text-danger',
    warn: 'bg-warn-soft text-warn',
    ok: 'bg-ok-soft text-ok',
    accent: 'bg-accent-soft text-accent',
  }
  return <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>
}

export function CountBadge({ count, className = '' }: { count: number; className?: string }) {
  if (count <= 0) return null
  return (
    <span
      className={`inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs leading-5 font-semibold text-on-accent ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

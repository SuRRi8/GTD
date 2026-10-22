import { Battery, Clock, FolderKanban, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useData } from '../data/hooks'
import type { NextAction } from '../data/types'
import { useCompletion } from '../state/feedback'
import { usePrefs } from '../state/prefs'
import { ActionEditor } from './ActionEditor'
import { ENERGY_LABEL, MINUTES_LABEL } from './labels'
import { AreaBadge, Pill } from './misc'

/** Runder Abhak-Knopf mit großer Tippfläche */
export function CheckButton({ onCheck, label }: { onCheck: () => void; label: string }) {
  const [checked, setChecked] = useState(false)
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        setChecked(true)
        // kurzer sichtbarer Haken, bevor der Eintrag aus der Liste verschwindet
        setTimeout(onCheck, 180)
      }}
      className="group flex size-11 shrink-0 items-center justify-center"
    >
      <span
        className={`flex size-6 items-center justify-center rounded-full border-2 transition ${
          checked ? 'border-ok bg-ok text-canvas' : 'border-ink-muted/50 group-hover:border-ok'
        }`}
      >
        {checked && (
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </button>
  )
}

export function ActionRow({
  action,
  showContext = false,
  showProject = true,
}: {
  action: NextAction
  showContext?: boolean
  showProject?: boolean
}) {
  const { projects, contexts, people } = useData()
  const { areaFilter } = usePrefs()
  const { completeAction } = useCompletion()
  const [editing, setEditing] = useState(false)

  const project = action.projectId ? projects.find((p) => p.id === action.projectId) : undefined
  const context = action.contextId ? contexts.find((c) => c.id === action.contextId) : undefined
  const agendaPerson = action.agendaPersonId ? people.find((p) => p.id === action.agendaPersonId) : undefined

  return (
    <div className="flex items-start gap-1 py-1 pr-3 pl-1">
      <CheckButton label={`„${action.title}“ erledigt`} onCheck={() => completeAction(action)} />
      <div className="min-w-0 flex-1 py-2">
        <button type="button" onClick={() => setEditing(true)} className="block w-full text-left break-words hover:text-accent">
          {action.title}
        </button>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-ink-muted empty:hidden">
          {showContext && context && <Pill>{context.name}</Pill>}
          {showContext && agendaPerson && (
            <Pill>
              <Users size={12} /> {agendaPerson.name}
            </Pill>
          )}
          {showProject && project && (
            <Link to={`/projekte/${project.id}`} className="inline-flex items-center gap-1 hover:text-accent">
              <FolderKanban size={14} /> {project.title}
            </Link>
          )}
          {action.minutes && (
            <Pill>
              <Clock size={12} /> {MINUTES_LABEL[action.minutes]}
            </Pill>
          )}
          {action.energy && (
            <Pill>
              <Battery size={12} /> {ENERGY_LABEL[action.energy].replace('Energie ', '')}
            </Pill>
          )}
          {areaFilter === 'alle' && <AreaBadge area={action.area} />}
        </div>
      </div>
      {editing && <ActionEditor action={action} onClose={() => setEditing(false)} />}
    </div>
  )
}

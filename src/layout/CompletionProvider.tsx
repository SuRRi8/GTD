import { ArrowRight, CircleCheck, Clock } from 'lucide-react'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Button } from '../components/Button'
import { isActionDraftValid, type ActionDraft } from '../components/actionDraft'
import { NextActionFields } from '../components/NextActionFields'
import { Sheet } from '../components/Sheet'
import { useData, useRepo } from '../data/hooks'
import type { NextAction, Project, WaitingFor } from '../data/types'
import { countOpenItems, openItemsOf } from '../domain/projects'
import { completeAction, completeWaiting, reopenAction, reopenWaiting, setProjectStatus } from '../services/tasks'
import { CompletionContext, useFeedback, type Completion } from '../state/feedback'
import { usePlanningData } from '../state/usePlanningData'
import { useToday } from '../state/useToday'

/**
 * Abhaken mit einem Tipp. Gehört der Eintrag zu einem aktiven Projekt, fragt die App
 * sofort: nächster Schritt? Projekt erledigt? Oder später entscheiden.
 */
export function CompletionProvider({ children }: { children: ReactNode }) {
  const repo = useRepo()
  const { projects } = useData()
  const { toast } = useFeedback()
  const [followUp, setFollowUp] = useState<Project | null>(null)

  const askForProject = useCallback(
    (projectId: string | undefined) => {
      const project = projects.find((p) => p.id === projectId)
      if (project?.status === 'aktiv') setFollowUp(project)
    },
    [projects],
  )

  const value = useMemo<Completion>(
    () => ({
      completeAction(action: NextAction) {
        void completeAction(repo, action.id).then(() => {
          toast('Erledigt', { actionLabel: 'Rückgängig', onAction: () => reopenAction(repo, action.id) })
          askForProject(action.projectId)
        })
      },
      completeWaiting(entry: WaitingFor) {
        void completeWaiting(repo, entry.id).then(() => {
          toast('Erledigt', { actionLabel: 'Rückgängig', onAction: () => reopenWaiting(repo, entry.id) })
          askForProject(entry.projectId)
        })
      },
    }),
    [repo, toast, askForProject],
  )

  return (
    <CompletionContext.Provider value={value}>
      {children}
      {followUp && <ProjectFollowUp project={followUp} onClose={() => setFollowUp(null)} />}
    </CompletionContext.Provider>
  )
}

function ProjectFollowUp({ project, onClose }: { project: Project; onClose: () => void }) {
  const repo = useRepo()
  const data = usePlanningData()
  const today = useToday()
  const { toast } = useFeedback()
  const [mode, setMode] = useState<'choose' | 'next'>('choose')
  const [draft, setDraft] = useState<ActionDraft>({ title: '' })
  const remaining = countOpenItems(openItemsOf(project.id, data, today))

  const saveNext = async () => {
    await repo.actions.add({ ...draft, title: draft.title.trim(), projectId: project.id, area: project.area })
    toast('Nächster Schritt angelegt')
    onClose()
  }

  const finishProject = async () => {
    await setProjectStatus(repo, project.id, 'erledigt')
    toast(`Projekt „${project.title}“ erledigt`)
    onClose()
  }

  const decideLater = () => {
    if (remaining === 0) toast('Projekt steht jetzt im Stillstand')
    onClose()
  }

  return (
    <Sheet
      open
      onClose={decideLater}
      title="Was ist der nächste Schritt?"
      footer={
        mode === 'next' ? (
          <>
            <Button variant="ghost" onClick={() => setMode('choose')}>
              Zurück
            </Button>
            <Button variant="primary" onClick={saveNext} disabled={!isActionDraftValid(draft)}>
              Speichern
            </Button>
          </>
        ) : undefined
      }
    >
      <p className="mb-4 text-ink-muted">
        Projekt <strong className="font-medium text-ink">„{project.title}“</strong>
        {remaining > 0 && <> · noch {remaining === 1 ? '1 offener Eintrag' : `${remaining} offene Einträge`}</>}
      </p>
      {mode === 'choose' ? (
        <div className="space-y-3">
          <FollowUpButton icon={<ArrowRight size={20} />} title="Nächsten Schritt festlegen" onClick={() => setMode('next')} autoFocus />
          <FollowUpButton icon={<CircleCheck size={20} />} title="Projekt ist erledigt" onClick={finishProject} />
          <FollowUpButton
            icon={<Clock size={20} />}
            title="Später entscheiden"
            description={remaining === 0 ? 'Das Projekt wird als Stillstand markiert.' : undefined}
            onClick={decideLater}
          />
        </div>
      ) : (
        <NextActionFields draft={draft} onChange={setDraft} autoFocus />
      )}
    </Sheet>
  )
}

function FollowUpButton({
  icon,
  title,
  description,
  onClick,
  autoFocus,
}: {
  icon: ReactNode
  title: string
  description?: string
  onClick: () => void
  autoFocus?: boolean
}) {
  return (
    <button
      type="button"
      autoFocus={autoFocus}
      onClick={onClick}
      className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-left hover:border-accent hover:bg-accent-soft/40"
    >
      <span className="text-accent">{icon}</span>
      <span>
        <span className="block font-medium">{title}</span>
        {description && <span className="block text-sm text-ink-muted">{description}</span>}
      </span>
    </button>
  )
}

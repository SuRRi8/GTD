import { ArrowLeft, ArrowRight, PartyPopper } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '../../components/Button'
import { PageHeader } from '../../components/misc'
import { useData, useRepo } from '../../data/hooks'
import { formatDay, localDateOf } from '../../domain/dates'
import { lastReview, PHASE_LABEL, REVIEW_STEPS } from '../../domain/weeklyReview'
import { useFeedback } from '../../state/feedback'
import { usePersistentState } from '../../state/storage'
import { useToday } from '../../state/useToday'
import {
  ActionsStep,
  CalendarStep,
  InboxStep,
  MindSweepStep,
  NotesStep,
  ProjectsStep,
  SomedayStep,
  WaitingStep,
} from './reviewSteps'

interface Progress {
  step: number
  project: number
}

const START: Progress = { step: 0, project: 0 }
const isProgress = (v: unknown): v is Progress =>
  typeof v === 'object' && v !== null && typeof (v as Progress).step === 'number' && typeof (v as Progress).project === 'number'

/**
 * Geführter Wochenrückblick. Der Fortschritt bleibt gespeichert, damit man
 * zwischendurch klären und danach weitermachen kann.
 */
export function WeeklyReviewPage() {
  const repo = useRepo()
  const { reviews } = useData()
  const today = useToday()
  const navigate = useNavigate()
  const { toast } = useFeedback()
  const [progress, setProgress] = usePersistentState<Progress>('gtd.reviewProgress', START, isProgress)
  const index = Math.min(Math.max(progress.step, 0), REVIEW_STEPS.length - 1)
  const step = REVIEW_STEPS[index]
  const last = lastReview(reviews)

  const goTo = (next: number) => {
    setProgress({ ...progress, step: next })
    window.scrollTo({ top: 0 })
  }

  const finish = async () => {
    await repo.reviews.add({ completedAt: new Date().toISOString() })
    setProgress(START)
    toast('Wochenrückblick abgeschlossen')
    navigate('/')
  }

  return (
    <>
      <PageHeader
        title="Wochenrückblick"
        subtitle={`Ein Rückblick für Arbeit und Privat · ${last ? `zuletzt ${formatDay(localDateOf(last.completedAt), today)}` : 'dein erster'}`}
      />

      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-accent">{PHASE_LABEL[step.phase]}</span>
          <span className="text-ink-muted">
            Schritt {index + 1} von {REVIEW_STEPS.length}
          </span>
        </div>
        <div className="flex gap-1" aria-hidden>
          {REVIEW_STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              tabIndex={-1}
              onClick={() => goTo(i)}
              className={`h-1.5 flex-1 rounded-full ${i <= index ? 'bg-accent' : 'bg-surface-2'}`}
              title={s.title}
            />
          ))}
        </div>
      </div>

      <h2 className="text-xl font-semibold tracking-tight">{step.title}</h2>
      <p className="mt-1 mb-5 text-ink-muted">{step.hint}</p>

      {step.id === 'notizen' && <NotesStep />}
      {step.id === 'eingang' && <InboxStep />}
      {step.id === 'kopf' && <MindSweepStep />}
      {step.id === 'schritte' && <ActionsStep />}
      {step.id === 'kalender' && <CalendarStep />}
      {step.id === 'warten' && <WaitingStep />}
      {step.id === 'projekte' && <ProjectsStep index={progress.project} onIndex={(project) => setProgress({ ...progress, project })} />}
      {step.id === 'irgendwann' && <SomedayStep />}
      {step.id === 'abschluss' && (
        <div className="flex flex-col items-center py-8 text-center">
          <span className="flex size-20 items-center justify-center rounded-full bg-ok-soft text-ok">
            <PartyPopper size={38} />
          </span>
          <p className="mt-4 max-w-sm text-ink-muted">Alles ist erfasst, geklärt und auf dem neuesten Stand. Jetzt kannst du dich voll auf das Tun konzentrieren.</p>
        </div>
      )}

      <div className="mt-8 flex gap-3 border-t border-line pt-4">
        {index > 0 && (
          <Button variant="ghost" onClick={() => goTo(index - 1)}>
            <ArrowLeft size={18} /> Zurück
          </Button>
        )}
        <div className="flex-1" />
        {step.id === 'abschluss' ? (
          <Button variant="primary" size="lg" onClick={finish}>
            Wochenrückblick abschließen
          </Button>
        ) : (
          <Button variant="primary" size="lg" onClick={() => goTo(index + 1)}>
            Weiter <ArrowRight size={18} />
          </Button>
        )}
      </div>
    </>
  )
}

import { TriangleAlert } from 'lucide-react'
import { isSingleWord } from '../domain/nextActionHint'
import type { ActionDraft } from './actionDraft'
import { Field, TextInput } from './forms'
import { ContextPicker, EnergyPicker, MinutesPicker } from './pickers'

/** Felder für einen nächsten Schritt: Formulierung, Kontext (Pflicht), Zeit, Energie */
export function NextActionFields({
  draft,
  onChange,
  autoFocus,
}: {
  draft: ActionDraft
  onChange: (draft: ActionDraft) => void
  autoFocus?: boolean
}) {
  return (
    <div className="space-y-4">
      <Field
        label="Nächster physischer Schritt"
        htmlFor="action-title"
        hint={
          isSingleWord(draft.title) ? (
            <span className="flex items-start gap-1.5 text-warn">
              <TriangleAlert size={16} className="mt-0.5 shrink-0" />
              Klingt nach einem Thema. Was genau tust du – anrufen, mailen, besorgen …?
            </span>
          ) : undefined
        }
      >
        <TextInput
          id="action-title"
          autoFocus={autoFocus}
          value={draft.title}
          onChange={(e) => onChange({ ...draft, title: e.target.value })}
          placeholder="z. B. Anna anrufen wegen Angebot"
        />
      </Field>
      <Field label="Kontext">
        <ContextPicker
          value={{ contextId: draft.contextId, agendaPersonId: draft.agendaPersonId }}
          onChange={(selection) => onChange({ ...draft, contextId: selection.contextId, agendaPersonId: selection.agendaPersonId })}
        />
      </Field>
      <Field label="Zeitbedarf (optional)">
        <MinutesPicker value={draft.minutes} onChange={(minutes) => onChange({ ...draft, minutes })} />
      </Field>
      <Field label="Energie (optional)">
        <EnergyPicker value={draft.energy} onChange={(energy) => onChange({ ...draft, energy })} />
      </Field>
    </div>
  )
}

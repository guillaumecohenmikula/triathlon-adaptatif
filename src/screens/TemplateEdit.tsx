import { useState } from "react";
import { ItemEditor } from "../components/ItemEditor";
import type { ActivityId, Movement, Template } from "../data/types";
import { addItem, emptyItem, moveItem, removeItem, updateItem } from "../engine/session";
import { ACCENT, ACTIVITY, CARD, INK, LINE, MUTED, ON_ACCENT, R, WARN_TX } from "../theme";

interface Props {
  template: Template;
  movements: Movement[];
  onSave: (template: Template) => void;
  /** Absent sur une séance fournie : on l'archive au lieu de l'effacer. */
  onDelete?: () => void;
  onBack: () => void;
}

const ACTIVITIES: ActivityId[] = ["course", "velo", "natation", "renfo", "autre"];

/** Création et modification d'un modèle de séance. Rien n'est écrit avant « Enregistrer ». */
export function TemplateEdit({ template, movements, onSave, onDelete, onBack }: Props) {
  const [draft, setDraft] = useState<Template>(template);
  const [confirming, setConfirming] = useState(false);

  const field = { border: `1px solid ${LINE}`, background: CARD, color: INK, fontSize: 16, padding: 8 };

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-sm bg-transparent border-none p-0 cursor-pointer"
        style={{ color: MUTED }}
      >
        ← Retour sans enregistrer
      </button>

      <p className="m-0 mb-2 text-sm font-medium">Nom</p>
      <input
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        placeholder="Renfo haut du corps, sortie longue…"
        className="w-full mb-4"
        style={field}
      />

      <p className="m-0 mb-2 text-sm font-medium">Discipline</p>
      <div className="flex flex-wrap gap-2 mb-5">
        {ACTIVITIES.map((a) => {
          const on = draft.disc === a;
          return (
            <button
              key={a}
              onClick={() => setDraft({ ...draft, disc: a })}
              className="text-sm px-3 cursor-pointer"
              style={{
                height: 40,
                border: `1px solid ${on ? ACTIVITY[a].c : LINE}`,
                background: on ? ACTIVITY[a].c : CARD,
                color: on ? ON_ACCENT : INK,
               borderRadius: R.pill,}}
            >
              {ACTIVITY[a].label}
            </button>
          );
        })}
      </div>

      <p className="m-0 mb-2 text-sm font-medium">Déroulé</p>
      {draft.items.length === 0 && (
        <p className="m-0 mb-2 text-sm" style={{ color: MUTED }}>
          Ajoute un exercice, un bloc de durée ou une distance.
        </p>
      )}
      {draft.items.map((item, i) => (
        <ItemEditor
          key={item.id}
          item={item}
          movements={movements}
          first={i === 0}
          last={i === draft.items.length - 1}
          onChange={(patch) => setDraft({ ...draft, items: updateItem(draft.items, item.id, patch) })}
          onRemove={() => setDraft({ ...draft, items: removeItem(draft.items, item.id) })}
          onMove={(delta) => setDraft({ ...draft, items: moveItem(draft.items, item.id, delta) })}
        />
      ))}

      <div className="flex gap-2 mb-5">
        {(["reps", "time", "distance"] as const).map((kind) => (
          <button
            key={kind}
            onClick={() => setDraft({ ...draft, items: addItem(draft.items, emptyItem(kind)) })}
            className="flex-1 text-sm cursor-pointer"
            style={{ height: 44, border: `1px solid ${LINE}`, background: CARD, color: INK , borderRadius: R.field}}
          >
            + {kind === "reps" ? "Exercice" : kind === "time" ? "Durée" : "Distance"}
          </button>
        ))}
      </div>

      <button
        onClick={() => onSave(draft)}
        className="w-full cursor-pointer border-none"
        style={{ height: 52, background: ACCENT, color: ON_ACCENT, fontSize: 16 , borderRadius: R.pill}}
      >
        Enregistrer
      </button>

      {onDelete && (
        <button
          onClick={() => (confirming ? onDelete() : setConfirming(true))}
          className="w-full mt-3 cursor-pointer"
          style={{
            height: 44,
            border: `1px solid ${confirming ? WARN_TX : LINE}`,
            background: "transparent",
            color: confirming ? WARN_TX : MUTED,
            fontSize: 14,
          }}
        >
          {confirming ? "Confirmer la suppression" : "Supprimer cette séance"}
        </button>
      )}
    </div>
  );
}

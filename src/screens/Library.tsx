import { useState } from "react";
import type { ActivityId, Template } from "../data/types";
import { plannedMinutes } from "../engine/session";
import { ACCENT, ACTIVITY, CARD, INK, LINE, MUTED, ON_ACCENT, R } from "../theme";

interface Props {
  templates: Template[];
  archived: Template[];
  onCreate: () => void;
  onEdit: (id: string) => void;
  onDuplicate: (template: Template) => void;
  onArchive: (id: string, archived: boolean) => void;
}

const ORDER: ActivityId[] = ["course", "velo", "natation", "renfo", "autre"];

/** Tes séances enregistrées : celles fournies avec l'app et les tiennes. */
export function Library({ templates, archived, onCreate, onEdit, onDuplicate, onArchive }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const row = (t: Template) => (
    <div key={t.id} className="mb-1">
      <button
        onClick={() => setOpen(open === t.id ? null : t.id)}
        className="w-full text-left p-3 cursor-pointer"
        style={{ background: CARD, border: "none", borderLeft: `3px solid ${ACTIVITY[t.disc].c}` , borderRadius: R.card}}
      >
        <div className="flex justify-between items-baseline gap-2">
          <p className="m-0 text-sm font-medium">{t.name}</p>
          <p className="m-0 text-xs whitespace-nowrap" style={{ color: MUTED }}>
            {plannedMinutes(t.items) > 0
              ? `${plannedMinutes(t.items)} min`
              : `${t.items.length} éléments`}
          </p>
        </div>
        <p className="m-0 mt-1 text-xs" style={{ color: MUTED }}>
          {t.items.length} élément{t.items.length > 1 ? "s" : ""}
          {t.builtIn ? " · fournie" : ""}
        </p>
      </button>

      {open === t.id && (
        <div className="flex gap-1 p-2" style={{ background: CARD, borderTop: `1px solid ${LINE}` , borderRadius: R.card}}>
          <button
            onClick={() => onEdit(t.id)}
            className="flex-1 text-xs cursor-pointer"
            style={{ height: 40, border: `1px solid ${LINE}`, background: CARD, color: INK , borderRadius: R.field}}
          >
            Modifier
          </button>
          <button
            onClick={() => onDuplicate(t)}
            className="flex-1 text-xs cursor-pointer"
            style={{ height: 40, border: `1px solid ${LINE}`, background: CARD, color: INK , borderRadius: R.field}}
          >
            Dupliquer
          </button>
          <button
            onClick={() => onArchive(t.id, !t.archived)}
            className="flex-1 text-xs cursor-pointer"
            style={{ height: 40, border: `1px solid ${LINE}`, background: CARD, color: MUTED , borderRadius: R.field}}
          >
            {t.archived ? "Remettre" : "Archiver"}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <p className="m-0 text-base font-medium">Mes séances</p>
      <p className="m-0 mb-4 text-xs" style={{ color: MUTED }}>
        Les modèles que tu poses sur ta semaine. Ceux fournis se modifient comme les autres.
      </p>

      <button
        onClick={onCreate}
        className="w-full mb-4 cursor-pointer border-none"
        style={{ height: 48, background: ACCENT, color: ON_ACCENT, fontSize: 15 , borderRadius: R.pill}}
      >
        Créer une séance
      </button>

      {ORDER.map((disc) => {
        const list = templates.filter((t) => t.disc === disc);
        if (list.length === 0) return null;
        return (
          <div key={disc} className="mb-4">
            <p className="m-0 mb-2 text-sm font-medium" style={{ color: ACTIVITY[disc].c }}>
              {ACTIVITY[disc].label}
            </p>
            {list.map(row)}
          </div>
        );
      })}

      {archived.length > 0 && (
        <>
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="w-full text-left p-3 mt-2 cursor-pointer"
            style={{ background: "transparent", border: `1px solid ${LINE}` }}
          >
            <p className="m-0 text-xs" style={{ color: MUTED }}>
              {archived.length} séance{archived.length > 1 ? "s" : ""} archivée
              {archived.length > 1 ? "s" : ""} · {showArchived ? "masquer" : "voir"}
            </p>
          </button>
          {showArchived && <div className="mt-2">{archived.map(row)}</div>}
        </>
      )}
    </div>
  );
}

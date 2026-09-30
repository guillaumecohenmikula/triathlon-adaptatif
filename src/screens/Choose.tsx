import { useState } from "react";
import type { ActivityId, Template } from "../data/types";
import { plannedMinutes } from "../engine/session";
import { dayLabel } from "../lib/date";
import { ACTIVITY, INK, LINE, MUTED } from "../theme";

interface Props {
  week: string;
  day: string;
  templates: Template[];
  onPick: (template: Template) => void;
  onBlank: () => void;
  onBack: () => void;
}

const ORDER: ActivityId[] = ["course", "velo", "natation", "renfo", "autre"];

/** Choisir la séance à poser sur un jour : une des tiennes, ou une séance vide. */
export function Choose({ week, day, templates, onPick, onBlank, onBack }: Props) {
  const [search, setSearch] = useState("");

  const match = templates.filter((t) =>
    t.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-sm bg-transparent border-none p-0 cursor-pointer"
        style={{ color: MUTED }}
      >
        ← Retour à la semaine
      </button>

      <p className="m-0 text-base font-medium">
        Ajouter {day.toLowerCase()} {dayLabel(week, day)}
      </p>
      <p className="m-0 mb-4 text-xs" style={{ color: MUTED }}>
        Tes séances enregistrées, ou une séance vide à composer.
      </p>

      <button
        onClick={onBlank}
        className="w-full mb-4 cursor-pointer border-none"
        style={{ height: 48, background: INK, color: "#fff", fontSize: 15 }}
      >
        Séance vide
      </button>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Chercher une séance"
        className="w-full p-2 mb-4"
        style={{ border: `1px solid ${LINE}`, background: "#fff", color: INK, fontSize: 16 }}
      />

      {ORDER.map((disc) => {
        const list = match.filter((t) => t.disc === disc);
        if (list.length === 0) return null;
        return (
          <div key={disc} className="mb-4">
            <p className="m-0 mb-2 text-sm font-medium" style={{ color: ACTIVITY[disc].c }}>
              {ACTIVITY[disc].label}
            </p>
            {list.map((t) => {
              const minutes = plannedMinutes(t.items);
              return (
                <button
                  key={t.id}
                  onClick={() => onPick(t)}
                  className="w-full text-left mb-1 p-3 cursor-pointer"
                  style={{
                    background: "#fff",
                    border: "none",
                    borderLeft: `3px solid ${ACTIVITY[disc].c}`,
                  }}
                >
                  <div className="flex justify-between items-baseline gap-2">
                    <p className="m-0 text-sm font-medium">{t.name}</p>
                    <p className="m-0 text-xs whitespace-nowrap" style={{ color: MUTED }}>
                      {minutes > 0 ? `${minutes} min` : `${t.items.length} éléments`}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        );
      })}

      {match.length === 0 && (
        <p className="m-0 text-sm" style={{ color: MUTED }}>
          Aucune séance à ce nom.
        </p>
      )}
    </div>
  );
}

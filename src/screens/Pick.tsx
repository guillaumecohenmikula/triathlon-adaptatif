import { useState } from "react";
import { Stepper } from "../components/Stepper";
import { BLOCKS, available } from "../data/blocks";
import type { BlockId } from "../data/blocks";
import { placeLabel } from "../data/settings";
import type { Access, Discipline, ModeId, Phase } from "../data/types";
import { DUR_MAX, DUR_MIN, DUR_STEP, recommended } from "../engine/week";
import { dayLabel, humanDuration } from "../lib/date";
import { DISC, INK, LINE, MUTED } from "../theme";

interface Props {
  week: string;
  day: string;
  access: Access;
  phase: Phase;
  mode: ModeId;
  /** Disciplines en retard, de la plus à la moins en retard. */
  late: Discipline[];
  /** Blocs déjà programmés cette semaine, pour éviter les doublons involontaires. */
  already: BlockId[];
  onAdd: (block: BlockId, dur: number) => void;
  onBack: () => void;
}

const ZONE_LABEL = { basse: "facile", seuil: "seuil", haute: "intense" } as const;
const ORDER: Discipline[] = ["course", "velo", "natation", "renfo"];

/** Arrondi au pas de durée, borné. */
const snap = (m: number) =>
  Math.min(DUR_MAX, Math.max(DUR_MIN, Math.round(m / DUR_STEP) * DUR_STEP));

/**
 * Le catalogue. Rien n'est posé à la place de l'utilisateur : les séances de la phase
 * passent en premier, marquées, et les disciplines en retard remontent parmi elles.
 */
export function Pick({ week, day, access, phase, mode, late, already, onAdd, onBack }: Props) {
  const [selected, setSelected] = useState<BlockId | null>(null);
  const [dur, setDur] = useState(60);

  const lateRank = (id: BlockId) => {
    const i = late.indexOf(BLOCKS[id].disc);
    return i < 0 ? late.length : i;
  };
  const advised = recommended(phase, mode, access).sort((a, b) => lateRank(a) - lateRank(b));
  const all = Object.keys(BLOCKS) as BlockId[];
  const others = all.filter((id) => available(id, access) && !advised.includes(id));
  const hidden = all.filter((id) => !available(id, access)).length;

  const select = (id: BlockId) => {
    if (selected === id) return setSelected(null);
    setSelected(id);
    setDur(snap(BLOCKS[id].min));
  };

  const row = (id: BlockId) => {
    const b = BLOCKS[id];
    const on = selected === id;
    const notes = [
      `${placeLabel(b.place)} · ${b.min} à ${b.max} min`,
      late.includes(b.disc) ? "à rattraper" : null,
      already.includes(id) ? "déjà prévue cette semaine" : null,
    ].filter(Boolean);

    return (
      <div key={id} className="mb-2">
        <button
          onClick={() => select(id)}
          className="w-full text-left p-3 cursor-pointer"
          style={{
            background: "#fff",
            // Côtés séparés : mêler `border` et `borderLeft` fausse le style au rerendu.
            borderTop: `1px solid ${on ? INK : LINE}`,
            borderRight: `1px solid ${on ? INK : LINE}`,
            borderBottom: `1px solid ${on ? INK : LINE}`,
            borderLeft: `3px solid ${DISC[b.disc].c}`,
          }}
        >
          <div className="flex justify-between items-baseline gap-2">
            <p className="m-0 text-sm font-medium">{b.label}</p>
            <p className="m-0 text-xs" style={{ color: MUTED }}>
              {b.zone ? ZONE_LABEL[b.zone] : "renfo"}
            </p>
          </div>
          <p className="m-0 mt-1 text-xs" style={{ color: MUTED }}>
            {notes.join(" · ")}
          </p>
        </button>

        {on && (
          <div className="p-3" style={{ background: "#fff", border: `1px solid ${INK}`, borderTop: "none" }}>
            <p className="m-0 mb-2 text-xs" style={{ color: MUTED }}>
              Durée
            </p>
            <Stepper
              value={dur}
              onChange={setDur}
              min={DUR_MIN}
              max={DUR_MAX}
              step={DUR_STEP}
              format={humanDuration}
              label="Durée"
            />
            <button
              onClick={() => onAdd(id, dur)}
              className="w-full mt-3 cursor-pointer border-none"
              style={{ height: 48, background: INK, color: "#fff", fontSize: 15 }}
            >
              Ajouter {day.toLowerCase()} {dayLabel(week, day)}
            </button>
          </div>
        )}
      </div>
    );
  };

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
        Programmer {day.toLowerCase()} {dayLabel(week, day)}
      </p>
      <p className="m-0 mb-4 text-xs" style={{ color: MUTED }}>
        Touche une séance pour régler sa durée.
      </p>

      {advised.length > 0 && (
        <>
          <p className="m-0 mb-1 text-sm font-medium">Conseillé en phase {phase.label.toLowerCase()}</p>
          <p className="m-0 mb-2 text-xs" style={{ color: MUTED }}>
            {phase.focus}
            {late.length > 0 ? " Les disciplines à rattraper passent en premier." : ""}
          </p>
          {advised.map(row)}
        </>
      )}

      {others.length > 0 && (
        <>
          <p className="m-0 mt-5 mb-2 text-sm font-medium">Autres séances</p>
          {ORDER.flatMap((d) => others.filter((id) => BLOCKS[id].disc === d)).map(row)}
        </>
      )}

      {hidden > 0 && (
        <p className="m-0 mt-3 text-xs" style={{ color: MUTED }}>
          {hidden} séance{hidden > 1 ? "s" : ""} masquée{hidden > 1 ? "s" : ""} faute du matériel
          nécessaire. Coche ce que tu as dans les réglages.
        </p>
      )}
    </div>
  );
}

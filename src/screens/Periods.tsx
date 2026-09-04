import { BLOCKS, available } from "../data/blocks";
import { PHASES } from "../data/phases";
import { placeLabel } from "../data/settings";
import type { Access, Discipline, ModeId, Phase } from "../data/types";
import { planFor } from "../engine/buildWeek";
import { DISC, INK, LINE, MUTED } from "../theme";

interface Props {
  phase: Phase;
  mode: ModeId;
  factor: number;
  access: Access;
  onBack: () => void;
}

/** Le plan complet, phase par phase. Les blocs hors de portée sont barrés. */
export function Periods({ phase, mode, factor, access, onBack }: Props) {
  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-sm bg-transparent border-none p-0 cursor-pointer"
        style={{ color: MUTED }}
      >
        ← Réglages
      </button>

      {PHASES.map((p) => (
        <div
          key={p.id}
          className="mb-3 p-3"
          style={{ background: "#fff", border: `1px solid ${p.id === phase.id ? INK : LINE}` }}
        >
          <div className="flex justify-between mb-1">
            <p className="m-0 text-sm font-medium">{p.label}</p>
            <p className="m-0 text-xs" style={{ color: MUTED }}>
              {p.minSlots} créneaux mini
            </p>
          </div>
          <p className="m-0 mb-2 text-xs" style={{ color: MUTED }}>
            {p.focus}
          </p>

          <div className="flex flex-wrap gap-2 mb-2">
            {(Object.keys(p.targets) as Discipline[]).map((d) => (
              <span key={d} className="text-xs" style={{ color: DISC[d].c }}>
                {DISC[d].label} {Math.round((p.targets[d] * factor) / 5) * 5} min
              </span>
            ))}
          </div>

          {planFor(p, mode).map((id, i) => {
            const ok = available(id, access);
            return (
              <p
                key={id}
                className="m-0 text-xs"
                style={{ color: ok ? INK : MUTED, textDecoration: ok ? "none" : "line-through" }}
              >
                {i + 1}. {BLOCKS[id].label} · {placeLabel(BLOCKS[id].place).toLowerCase()} ·{" "}
                {BLOCKS[id].min}–{BLOCKS[id].max} min
              </p>
            );
          })}
        </div>
      ))}
    </div>
  );
}

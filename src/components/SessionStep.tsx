import { BLOCKS } from "../data/blocks";
import type { Step } from "../engine/steps";
import { setCount } from "../engine/steps";
import { DISC, INK, LINE, MUTED } from "../theme";

interface Props {
  steps: Step[];
  idx: number;
  checks: Record<number, number>;
  onCheck: (idx: number, sets: number) => void;
  onMove: (idx: number) => void;
  onBack: () => void;
  onFinish: () => void;
}

/** Mode pas-à-pas : une étape par écran, gros titres, cases de séries à cocher. */
export function SessionStep({ steps, idx, checks, onCheck, onMove, onBack, onFinish }: Props) {
  const cur = steps[Math.min(idx, steps.length - 1)];
  if (!cur) return null;

  const col = DISC[BLOCKS[cur.block].disc].c;
  const n = setCount(cur.sets);
  const done = checks[idx] ?? 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={onBack}
          className="text-sm bg-transparent border-none p-0 cursor-pointer"
          style={{ color: MUTED }}
        >
          ← Aperçu
        </button>
        <p className="m-0 text-sm" style={{ color: MUTED }}>
          {idx + 1} / {steps.length}
        </p>
      </div>

      <div className="flex gap-1 mb-6">
        {steps.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, background: i <= idx ? col : LINE }} />
        ))}
      </div>

      <p className="m-0 mb-1 text-xs" style={{ color: col }}>
        {BLOCKS[cur.block].label}
      </p>
      <p className="m-0 mb-3" style={{ fontSize: 26, fontWeight: 500, lineHeight: 1.15 }}>
        {cur.title}
      </p>

      {cur.sets && (
        <p className="m-0 mb-4" style={{ fontSize: 20, color: col }}>
          {cur.sets}
        </p>
      )}
      {cur.dur > 0 && !cur.sets && (
        <p className="m-0 mb-4" style={{ fontSize: 20, color: col }}>
          {cur.dur} min
        </p>
      )}

      {cur.kind === "exo" && (
        <div className="flex gap-2 mb-5">
          {Array.from({ length: n }).map((_, i) => (
            <button
              key={i}
              onClick={() => onCheck(idx, done === i + 1 ? i : i + 1)}
              className="cursor-pointer"
              style={{
                flex: 1,
                height: 44,
                border: `1px solid ${i < done ? col : LINE}`,
                background: i < done ? col : "#fff",
                color: i < done ? "#fff" : MUTED,
                fontSize: 15,
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {cur.load && (
        <p className="m-0 mb-2" style={{ fontSize: 15 }}>
          Charge — {cur.load}
        </p>
      )}
      {cur.cue && (
        <p className="m-0 mb-2" style={{ fontSize: 15, color: MUTED }}>
          {cur.cue}
        </p>
      )}
      {cur.text && (
        <p className="m-0 mb-2" style={{ fontSize: 15, color: MUTED }}>
          {cur.text}
        </p>
      )}

      <div className="flex gap-2 mt-6">
        <button
          onClick={() => onMove(Math.max(0, idx - 1))}
          disabled={idx === 0}
          className="cursor-pointer"
          style={{
            width: 90,
            height: 52,
            border: `1px solid ${LINE}`,
            background: "#fff",
            color: idx === 0 ? LINE : INK,
            fontSize: 15,
          }}
        >
          Précédent
        </button>
        {idx < steps.length - 1 ? (
          <button
            onClick={() => onMove(idx + 1)}
            className="flex-1 cursor-pointer border-none"
            style={{ height: 52, background: INK, color: "#fff", fontSize: 16 }}
          >
            Suivant
          </button>
        ) : (
          <button
            onClick={onFinish}
            className="flex-1 cursor-pointer border-none"
            style={{ height: 52, background: col, color: "#fff", fontSize: 16 }}
          >
            Séance terminée
          </button>
        )}
      </div>
    </div>
  );
}

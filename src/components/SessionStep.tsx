import { useEffect, useRef, useState } from "react";
import { BLOCKS } from "../data/blocks";
import { guidesFor } from "../data/guides";
import { SESSION_GUIDES } from "../data/sessionGuides";
import { clock, restSeconds } from "../engine/rest";
import type { Step } from "../engine/steps";
import { setCount } from "../engine/steps";
import { useNow } from "../hooks/useNow";
import { useWakeLock } from "../hooks/useWakeLock";
import { chime, tick, unlockAudio } from "../lib/beep";
import { DISC, INK, LINE, MUTED, PAPER } from "../theme";
import { DrillsView, ExerciseGuideView } from "./Guide";

interface Props {
  steps: Step[];
  idx: number;
  checks: Record<number, number>;
  onCheck: (idx: number, sets: number) => void;
  onMove: (idx: number) => void;
  onBack: () => void;
  onFinish: () => void;
}

interface Rest {
  endsAt: number;
  /** Numéro de la série qui suit le repos. */
  next: number;
}

/**
 * Mode pas-à-pas : une étape par écran. Sur un exercice, cocher une série lance le repos
 * écrit dans la consigne, et la fiche d'exécution suit sous les cases.
 */
export function SessionStep({ steps, idx, checks, onCheck, onMove, onBack, onFinish }: Props) {
  const cur = steps[Math.min(idx, steps.length - 1)];
  const [rest, setRest] = useState<Rest | null>(null);
  const now = useNow(rest !== null);
  const remaining = rest ? (rest.endsAt - now) / 1000 : 0;

  // On pose le téléphone pendant les séries : l'écran ne doit pas s'éteindre.
  useWakeLock(true);

  const fired = useRef(false);
  const lastTick = useRef<number | null>(null);
  useEffect(() => {
    if (!rest) return;
    const s = Math.ceil(remaining);
    if (s <= 0 && !fired.current) {
      fired.current = true;
      chime();
    } else if (s >= 1 && s <= 3 && s !== lastTick.current) {
      lastTick.current = s;
      tick();
    }
  }, [rest, remaining]);

  if (!cur) return null;

  const col = DISC[BLOCKS[cur.block].disc].c;
  const n = setCount(cur.sets);
  const done = checks[idx] ?? 0;
  const rest0 = cur.kind === "exo" ? restSeconds(cur.cue, cur.role) : 0;
  const guides = cur.kind === "exo" ? guidesFor(cur.title) : [];
  const drills = cur.title === "Éducatifs" ? SESSION_GUIDES[cur.block]?.drills : undefined;

  const check = (i: number) => {
    const count = done === i + 1 ? i : i + 1;
    onCheck(idx, count);
    unlockAudio();
    fired.current = false;
    lastTick.current = null;
    // Pas de repos après la dernière série, ni quand on décoche.
    setRest(count > done && count < n ? { endsAt: Date.now() + rest0 * 1000, next: count + 1 } : null);
  };

  const move = (to: number) => {
    setRest(null);
    onMove(to);
  };

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
        <p className="m-0 mb-1" style={{ fontSize: 20, color: col }}>
          {cur.sets}
        </p>
      )}
      {cur.dur > 0 && !cur.sets && (
        <p className="m-0 mb-4" style={{ fontSize: 20, color: col }}>
          {cur.rep ? `${cur.rep.n} × ${cur.rep.work} min, ${cur.rep.rest} min de récupération` : `${cur.dur} min`}
        </p>
      )}

      {cur.kind === "exo" && (
        <>
          {cur.load && (
            <p className="m-0 mb-1" style={{ fontSize: 15 }}>
              <span style={{ color: MUTED }}>Charge · </span>
              {cur.load}
            </p>
          )}
          <p className="m-0 mb-3" style={{ fontSize: 15 }}>
            <span style={{ color: MUTED }}>Repos · </span>
            {clock(rest0)} entre les séries
          </p>

          <div className="flex gap-2 mb-3">
            {Array.from({ length: n }).map((_, i) => (
              <button
                key={i}
                onClick={() => check(i)}
                aria-label={`Série ${i + 1}`}
                className="cursor-pointer"
                style={{
                  flex: 1,
                  height: 48,
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

          {rest && (
            <div className="p-3 mb-3" style={{ background: remaining > 0 ? INK : col, color: "#fff" }}>
              {remaining > 0 ? (
                <>
                  <p className="m-0 text-xs" style={{ opacity: 0.8 }}>
                    Repos avant la série {rest.next}
                  </p>
                  <p className="m-0 my-1" style={{ fontSize: 48, fontWeight: 500, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                    {clock(remaining)}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setRest({ ...rest, endsAt: rest.endsAt + 30_000 })}
                      className="flex-1 cursor-pointer"
                      style={{ height: 40, border: "1px solid #fff", background: "transparent", color: "#fff" }}
                    >
                      + 30 s
                    </button>
                    <button
                      onClick={() => setRest(null)}
                      className="flex-1 cursor-pointer border-none"
                      style={{ height: 40, background: "#fff", color: INK }}
                    >
                      Passer
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center">
                  <p className="m-0 text-base font-medium">C'est reparti : série {rest.next}</p>
                  <button
                    onClick={() => setRest(null)}
                    className="cursor-pointer border-none px-4"
                    style={{ height: 40, background: "#fff", color: INK }}
                  >
                    OK
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {cur.cue && (
        <p className="m-0 mb-4" style={{ fontSize: 15, color: MUTED }}>
          {cur.cue}
        </p>
      )}
      {cur.text && (
        <p className="m-0 mb-4" style={{ fontSize: 15, color: MUTED, lineHeight: 1.45 }}>
          {cur.text}
        </p>
      )}

      {guides.map((g) => (
        <ExerciseGuideView key={g.name} guide={g} titled={guides.length > 1} />
      ))}
      {drills && (
        <div className="p-3 mb-4 text-sm" style={{ background: "#fff", border: `1px solid ${LINE}` }}>
          <DrillsView drills={drills} />
        </div>
      )}

      {/* Toujours à portée de pouce, même sous une longue fiche. */}
      <div className="flex gap-2 py-3" style={{ position: "sticky", bottom: 0, background: PAPER }}>
        <button
          onClick={() => move(Math.max(0, idx - 1))}
          disabled={idx === 0}
          className="cursor-pointer"
          style={{
            width: 100,
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
            onClick={() => move(idx + 1)}
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

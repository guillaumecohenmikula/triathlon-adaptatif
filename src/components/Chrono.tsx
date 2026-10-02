import { useEffect, useMemo, useRef } from "react";
import type { ActivityId, Item } from "../data/types";
import { clock } from "../engine/rest";
import { locate, timeline, totalSeconds } from "../engine/timeline";
import { useNow } from "../hooks/useNow";
import { useWakeLock } from "../hooks/useWakeLock";
import { chime, tick, unlockAudio } from "../lib/beep";
import { humanDuration } from "../lib/date";
import { ACCENT, CARD, INK, LINE, MUTED, ON_ACCENT, ON_FILL, R } from "../theme";
import type { ChronoState } from "./chronoState";

interface Props {
  items: Item[];
  disc: ActivityId;
  color: string;
  state: ChronoState;
  onState: (s: ChronoState) => void;
  onBack: () => void;
  onFinish: () => void;
}

const KIND = { work: "Effort", rest: "Récupération", steady: "" } as const;

/** Le chrono d'une séance de course ou de vélo : il enchaîne les phases et les annonce. */
export function Chrono({ items, disc, color, state, onState, onBack, onFinish }: Props) {
  const phases = useMemo(() => timeline(items, disc), [items, disc]);
  const total = totalSeconds(phases);
  const { startedAt, pausedAt, offset } = state;

  const running = startedAt !== null && pausedAt === null;
  const now = useNow(running);
  const elapsed = startedAt === null ? 0 : ((pausedAt ?? now) - startedAt) / 1000 + offset;
  const pos = locate(phases, elapsed);
  const done = pos.index >= phases.length;
  const cur = phases[Math.min(pos.index, phases.length - 1)];
  const next = phases[pos.index + 1];

  useWakeLock(startedAt !== null && !done);

  // Les signaux partent des changements d'état, pas d'un minuteur : un passage en
  // arrière-plan ne les empile pas au retour.
  const lastIndex = useRef(pos.index);
  const lastTick = useRef<number | null>(null);
  useEffect(() => {
    if (!running) return;
    if (pos.index !== lastIndex.current) {
      lastIndex.current = pos.index;
      lastTick.current = null;
      chime();
      return;
    }
    const s = Math.ceil(pos.remaining);
    if (!done && s >= 1 && s <= 3 && s !== lastTick.current) {
      lastTick.current = s;
      tick();
    }
  }, [running, pos.index, pos.remaining, done]);

  const start = () => {
    unlockAudio();
    lastIndex.current = 0;
    onState({ startedAt: Date.now(), pausedAt: null, offset: 0 });
  };
  const pause = () => onState({ ...state, pausedAt: Date.now() });
  const resume = () => {
    unlockAudio();
    onState({ ...state, pausedAt: null, offset: offset - (Date.now() - (pausedAt ?? Date.now())) / 1000 });
  };
  const skip = () => onState({ ...state, offset: offset + pos.remaining + 0.01 });

  const big = { fontVariantNumeric: "tabular-nums" as const, fontWeight: 500, lineHeight: 1 };

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
        <p className="m-0 text-sm" style={{ color: MUTED, fontVariantNumeric: "tabular-nums" }}>
          {clock(Math.floor(Math.min(elapsed, total)))} / {clock(total)}
        </p>
      </div>

      <div className="flex mb-6" style={{ height: 8, gap: 2 }}>
        {phases.map((p, i) => (
          <div
            key={i}
            style={{
              flexGrow: p.sec,
              background: i < pos.index ? color : i === pos.index ? INK : LINE,
              opacity: i > pos.index && p.kind === "work" ? 0.45 : 1,
              ...(i > pos.index && p.kind === "work" ? { background: color } : {}),
            }}
          />
        ))}
      </div>

      {startedAt === null && (
        <div>
          <p className="m-0 mb-1 text-xs" style={{ color: MUTED }}>
            Prêt
          </p>
          <p className="m-0 mb-2" style={{ fontSize: 26, fontWeight: 500 }}>
            {phases[0].label}
          </p>
          <p className="m-0 mb-3" style={{ ...big, fontSize: 64 }}>
            {clock(phases[0].sec)}
          </p>
          <p className="m-0 mb-5 text-sm" style={{ color: MUTED }}>
            {phases.length} phases · {humanDuration(Math.round(total / 60))}
          </p>
          <button
            onClick={start}
            className="w-full cursor-pointer border-none"
            style={{ height: 56, background: color, color: ON_FILL, fontSize: 17 }}
          >
            Démarrer le chrono
          </button>
          <p className="m-0 mt-3 text-xs" style={{ color: MUTED }}>
            Garde l'app ouverte : l'écran reste allumé pendant le chrono, et chaque changement de
            phase est annoncé par un signal. En mode silencieux, le son ne passe pas.
          </p>
        </div>
      )}

      {startedAt !== null && !done && (
        <div>
          {KIND[cur.kind] && (
            <p
              className="m-0 mb-1 text-xs"
              style={{ color: cur.kind === "work" ? color : MUTED, letterSpacing: "0.06em" }}
            >
              {KIND[cur.kind].toUpperCase()}
            </p>
          )}
          <p className="m-0 mb-3" style={{ fontSize: 26, fontWeight: 500 }}>
            {cur.label}
          </p>
          <p className="m-0 mb-4" style={{ ...big, fontSize: 80, color: cur.kind === "work" ? color : INK }}>
            {clock(pos.remaining)}
          </p>
          {cur.text && (
            <p className="m-0 mb-3" style={{ fontSize: 15, color: MUTED, lineHeight: 1.45 }}>
              {cur.text}
            </p>
          )}
          {next && (
            <p className="m-0 mb-2 text-sm" style={{ color: MUTED }}>
              Ensuite : {next.label} · {clock(next.sec)}
            </p>
          )}
          {pausedAt !== null && (
            <p className="m-0 mb-2 text-sm font-medium">En pause</p>
          )}

          <div className="flex gap-2 mt-6">
            <button
              onClick={pausedAt === null ? pause : resume}
              className="flex-1 cursor-pointer"
              style={{ height: 52, border: `1px solid ${INK}`, background: CARD, color: INK, fontSize: 16 , borderRadius: R.field}}
            >
              {pausedAt === null ? "Pause" : "Reprendre"}
            </button>
            <button
              onClick={skip}
              className="flex-1 cursor-pointer border-none"
              style={{ height: 52, background: ACCENT, color: ON_ACCENT, fontSize: 16 , borderRadius: R.pill}}
            >
              Passer →
            </button>
          </div>
        </div>
      )}

      {done && (
        <div>
          <p className="m-0 mb-2" style={{ fontSize: 26, fontWeight: 500 }}>
            Séance terminée
          </p>
          <p className="m-0 mb-5 text-sm" style={{ color: MUTED }}>
            Marche quelques minutes et bois un peu. Des étirements légers si tu en as envie.
          </p>
          <button
            onClick={onFinish}
            className="w-full cursor-pointer border-none"
            style={{ height: 56, background: color, color: ON_FILL, fontSize: 17 }}
          >
            Noter la séance comme faite
          </button>
        </div>
      )}
    </div>
  );
}

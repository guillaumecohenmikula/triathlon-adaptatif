import { useMemo, useState } from "react";
import { SessionStep } from "../components/SessionStep";
import { BLOCKS } from "../data/blocks";
import { PROGRESSION, STATES, placeLabel } from "../data/settings";
import type { Phase, PlacedSession, SessionState, Zones } from "../data/types";
import { buildSteps } from "../engine/steps";
import { DISC, INK, LINE, MUTED } from "../theme";

interface Props {
  session: PlacedSession;
  phase: Phase;
  weekInBlock: number;
  zones: Zones;
  state?: SessionState;
  onMark: (state: SessionState) => void;
  /** « Je ne peux pas ce jour » : annule le créneau sans compter d'échec. */
  onCancel: () => void;
  onBack: () => void;
}

export function Session({
  session,
  phase,
  weekInBlock,
  zones,
  state,
  onMark,
  onCancel,
  onBack,
}: Props) {
  const [focus, setFocus] = useState(false);
  const [idx, setIdx] = useState(0);
  const [checks, setChecks] = useState<Record<number, number>>({});

  const total = session.blocks.reduce((a, b) => a + b.dur, 0);
  const steps = useMemo(
    () => buildSteps(session.blocks, phase.id, weekInBlock, zones),
    [session.blocks, phase.id, weekInBlock, zones],
  );

  if (focus) {
    return (
      <SessionStep
        steps={steps}
        idx={idx}
        checks={checks}
        onCheck={(i, sets) => setChecks((c) => ({ ...c, [i]: sets }))}
        onMove={setIdx}
        onBack={() => setFocus(false)}
        onFinish={() => {
          onMark("fait");
          setFocus(false);
        }}
      />
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-sm bg-transparent border-none p-0 cursor-pointer"
        style={{ color: MUTED }}
      >
        ← Retour à la semaine
      </button>

      <div className="flex justify-between items-baseline mb-1">
        <p className="m-0 text-base font-medium">
          {session.day} · {placeLabel(session.place).toLowerCase()}
        </p>
        <p className="m-0 text-sm" style={{ color: MUTED }}>
          {total} min
        </p>
      </div>
      <p className="m-0 mb-4 text-xs" style={{ color: MUTED }}>
        {PROGRESSION[weekInBlock]}
      </p>

      <button
        onClick={() => {
          setIdx(0);
          setFocus(true);
        }}
        className="w-full mb-5 cursor-pointer border-none"
        style={{ height: 52, background: INK, color: "#fff", fontSize: 16 }}
      >
        Démarrer la séance
      </button>

      {steps.map((s, i) => (
        <button
          key={i}
          onClick={() => {
            setIdx(i);
            setFocus(true);
          }}
          className="w-full text-left mb-2 p-3 cursor-pointer"
          style={{
            background: "#fff",
            border: "none",
            borderLeft: `3px solid ${DISC[BLOCKS[s.block].disc].c}`,
          }}
        >
          <div className="flex justify-between items-baseline">
            <p className="m-0 text-sm font-medium">{s.title}</p>
            <p
              className="m-0 text-xs"
              style={{ color: s.zoneFocus ? DISC[BLOCKS[s.block].disc].c : MUTED }}
            >
              {s.zoneFocus ? "priorisé · " : ""}
              {s.sets ?? `${s.dur} min`}
            </p>
          </div>
        </button>
      ))}

      <p className="m-0 mt-5 mb-2 text-sm font-medium">Bilan de la séance</p>
      <div className="flex gap-2">
        {STATES.map(([id, label]) => (
          <button
            key={id}
            onClick={() => onMark(id)}
            className="flex-1 cursor-pointer"
            style={{
              height: 44,
              border: `1px solid ${state === id ? INK : LINE}`,
              background: state === id ? INK : "#fff",
              color: state === id ? "#fff" : MUTED,
              fontSize: 14,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Volontairement séparé du bilan : un empêchement n'est pas un échec. */}
      <div className="mt-6 pt-4" style={{ borderTop: `1px solid ${LINE}` }}>
        <button
          onClick={onCancel}
          className="w-full cursor-pointer"
          style={{ height: 44, border: `1px solid ${LINE}`, background: "transparent", color: INK, fontSize: 14 }}
        >
          Je ne peux pas ce jour
        </button>
        <p className="m-0 mt-2 text-xs" style={{ color: MUTED }}>
          Le créneau saute et la séance repart sur un autre jour libre si c'est possible.
          Ça ne compte pas comme une séance ratée.
        </p>
      </div>
    </div>
  );
}

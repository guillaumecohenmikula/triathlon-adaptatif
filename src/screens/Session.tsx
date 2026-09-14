import { useMemo, useState } from "react";
import { SessionStep } from "../components/SessionStep";
import { Stepper } from "../components/Stepper";
import { BLOCKS } from "../data/blocks";
import { DAYS, MODE_GUIDANCE, PROGRESSION, STATES, placeLabel } from "../data/settings";
import type { ModeId, Phase, PlannedSession, SessionState, Zones } from "../data/types";
import { buildSteps } from "../engine/steps";
import { DUR_MAX, DUR_MIN, DUR_STEP, minutesOf } from "../engine/week";
import { dayLabel, humanDuration } from "../lib/date";
import { DISC, INK, LINE, MUTED, WARN_TX } from "../theme";

interface Props {
  session: PlannedSession;
  phase: Phase;
  weekInBlock: number;
  zones: Zones;
  /** Allure de seuil en natation, en secondes par 100 m. */
  css?: number;
  mode: ModeId;
  /** Lundi ISO de la semaine affichée, pour dater la séance. */
  week: string;
  state?: SessionState;
  onMark: (state: SessionState) => void;
  onMove: (day: string) => void;
  onResize: (dur: number) => void;
  onRemove: () => void;
  onBack: () => void;
}

export function Session({
  session,
  week,
  phase,
  weekInBlock,
  zones,
  css,
  mode,
  state,
  onMark,
  onMove,
  onResize,
  onRemove,
  onBack,
}: Props) {
  const [focus, setFocus] = useState(false);
  const [idx, setIdx] = useState(0);
  const [checks, setChecks] = useState<Record<number, number>>({});
  const [confirming, setConfirming] = useState(false);

  const total = minutesOf(session);
  const first = BLOCKS[session.blocks[0].id];
  const hasRenfo = session.blocks.some((b) => BLOCKS[b.id].disc === "renfo");
  const steps = useMemo(
    () => buildSteps(session.blocks, phase.id, weekInBlock, zones, css, mode),
    [session.blocks, phase.id, weekInBlock, zones, css, mode],
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
          {session.day} {dayLabel(week, session.day)} · {placeLabel(first.place).toLowerCase()}
        </p>
        <p className="m-0 text-sm" style={{ color: MUTED }}>
          {total} min
        </p>
      </div>
      <p className="m-0 mb-2 text-xs" style={{ color: MUTED }}>
        {PROGRESSION[weekInBlock]}
      </p>
      {hasRenfo && (
        <p className="m-0 mb-4 text-xs" style={{ color: MUTED }}>
          {MODE_GUIDANCE[mode]}
        </p>
      )}

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

      <div className="mt-6 pt-4" style={{ borderTop: `1px solid ${LINE}` }}>
        <p className="m-0 mb-2 text-sm font-medium">Organiser</p>

        <p className="m-0 mb-2 text-xs" style={{ color: MUTED }}>
          Jour
        </p>
        <div className="grid gap-1 mb-4" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
          {DAYS.map((d) => {
            const on = d === session.day;
            return (
              <button
                key={d}
                onClick={() => !on && onMove(d)}
                aria-label={`Déplacer à ${d}`}
                className="cursor-pointer p-0"
                style={{
                  height: 40,
                  border: `1px solid ${on ? INK : LINE}`,
                  background: on ? INK : "#fff",
                  color: on ? "#fff" : INK,
                  fontSize: 13,
                }}
              >
                {d.slice(0, 3)}
              </button>
            );
          })}
        </div>

        {session.blocks.length === 1 && (
          <div className="mb-4">
            <p className="m-0 mb-2 text-xs" style={{ color: MUTED }}>
              Durée
            </p>
            <Stepper
              value={total}
              onChange={onResize}
              min={DUR_MIN}
              max={DUR_MAX}
              step={DUR_STEP}
              format={humanDuration}
              label="Durée"
            />
            <p className="m-0 mt-2 text-xs" style={{ color: MUTED }}>
              Conseillé : {first.min} à {first.max} min. Le contenu de la séance suit la durée.
            </p>
          </div>
        )}

        <button
          onClick={() => (confirming ? onRemove() : setConfirming(true))}
          className="w-full cursor-pointer"
          style={{
            height: 44,
            border: `1px solid ${confirming ? WARN_TX : LINE}`,
            background: "transparent",
            color: confirming ? WARN_TX : INK,
            fontSize: 14,
          }}
        >
          {confirming ? "Confirmer le retrait" : "Retirer de la semaine"}
        </button>
        {confirming && state && (
          <p className="m-0 mt-2 text-xs" style={{ color: WARN_TX }}>
            Le bilan de cette séance quittera aussi l'historique.
          </p>
        )}
      </div>
    </div>
  );
}

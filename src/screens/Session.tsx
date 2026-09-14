import { useMemo, useState } from "react";
import { Chrono } from "../components/Chrono";
import { IDLE } from "../components/chronoState";
import type { ChronoState } from "../components/chronoState";
import { Fold, Points, SessionGuideView } from "../components/Guide";
import { SessionStep } from "../components/SessionStep";
import { Stepper } from "../components/Stepper";
import { BLOCKS } from "../data/blocks";
import { DAYS, MODE_GUIDANCE, PROGRESSION, STATES, placeLabel } from "../data/settings";
import type { ModeId, Phase, PlannedSession, SessionState, Zones } from "../data/types";
import { LOAD_PRIMER } from "../data/guides";
import { SESSION_GUIDES } from "../data/sessionGuides";
import { buildSteps } from "../engine/steps";
import { timeable } from "../engine/timeline";
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
  const [focus, setFocus] = useState<"apercu" | "etapes" | "chrono">("apercu");
  const [chrono, setChrono] = useState<ChronoState>(IDLE);
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

  const withChrono = timeable(steps);
  const guides = session.blocks
    .map((b) => ({ id: b.id, guide: SESSION_GUIDES[b.id] }))
    .filter((x) => x.guide);

  if (focus === "chrono") {
    return (
      <Chrono
        steps={steps}
        color={DISC[first.disc].c}
        state={chrono}
        onState={setChrono}
        onBack={() => setFocus("apercu")}
        onFinish={() => {
          if (state !== "fait") onMark("fait");
          setChrono(IDLE);
          setFocus("apercu");
        }}
      />
    );
  }

  if (focus === "etapes") {
    return (
      <SessionStep
        steps={steps}
        idx={idx}
        checks={checks}
        onCheck={(i, sets) => setChecks((c) => ({ ...c, [i]: sets }))}
        onMove={setIdx}
        onBack={() => setFocus("apercu")}
        onFinish={() => {
          if (state !== "fait") onMark("fait");
          setFocus("apercu");
        }}
      />
    );
  }

  const chronoLive = chrono.startedAt !== null;

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
      <p className="m-0 mb-4 text-sm" style={{ color: DISC[first.disc].c }}>
        {session.blocks.map((b) => BLOCKS[b.id].label).join(" + ")}
      </p>

      <button
        onClick={() => {
          if (withChrono) return setFocus("chrono");
          setIdx(0);
          setFocus("etapes");
        }}
        className="w-full mb-5 cursor-pointer border-none"
        style={{ height: 52, background: INK, color: "#fff", fontSize: 16 }}
      >
        {withChrono ? (chronoLive ? "Reprendre le chrono" : "Lancer le chrono") : "Démarrer la séance"}
      </button>

      {guides.map(({ id, guide }) => (
        <SessionGuideView key={id} guide={guide!} color={DISC[BLOCKS[id].disc].c} />
      ))}

      {hasRenfo && (
        <div className="mb-4">
          <div className="p-3 mb-2 text-sm" style={{ background: "#fff", borderLeft: `3px solid ${DISC.renfo.c}`, lineHeight: 1.5 }}>
            <p className="m-0 mb-2">{PROGRESSION[weekInBlock]}</p>
            <p className="m-0" style={{ color: MUTED }}>
              {MODE_GUIDANCE[mode]}
            </p>
          </div>
          <Fold title="Choisir ta charge">
            <Points items={LOAD_PRIMER} />
          </Fold>
        </div>
      )}

      <p className="m-0 mt-5 mb-2 text-sm font-medium">Déroulé</p>
      {steps.map((s, i) => (
        <button
          key={i}
          onClick={() => {
            setIdx(i);
            setFocus("etapes");
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
              {s.sets ?? (s.rep ? `${s.rep.n} × ${s.rep.work} min` : `${s.dur} min`)}
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

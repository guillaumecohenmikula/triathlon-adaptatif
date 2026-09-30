import { useMemo, useState } from "react";
import { Chrono } from "../components/Chrono";
import { IDLE } from "../components/chronoState";
import type { ChronoState } from "../components/chronoState";
import { Fold, Points, SessionGuideView } from "../components/Guide";
import { ItemEditor } from "../components/ItemEditor";
import { SessionStep } from "../components/SessionStep";
import { LOAD_PRIMER } from "../data/guides";
import type { SessionGuide } from "../data/sessionGuides";
import { DAYS, STATES } from "../data/settings";
import type { Actual, ActivityId, DoneItem, Item, Movement, Session, SessionState, Template } from "../data/types";
import { previousDone } from "../engine/kpi";
import { addItem, emptyItem, moveItem, newId, plannedMinutes, removeItem, updateItem } from "../engine/session";
import { timeable } from "../engine/timeline";
import { dayLabel, humanDuration } from "../lib/date";
import { distanceInput, distanceUnit, parseDistance, rpeLabel } from "../lib/extra";
import { withPaces } from "../lib/swim";
import { ACTIVITY, INK, LINE, MUTED, WARN_TX } from "../theme";

interface Props {
  session: Session;
  /** Tout le carnet, pour retrouver ce qui a été soulevé la dernière fois. */
  sessions: Session[];
  movements: Movement[];
  guide?: SessionGuide;
  css?: number;
  onPatch: (change: Partial<Session>) => void;
  onItems: (items: Item[]) => void;
  onDone: (itemId: string, done: DoneItem | undefined) => void;
  onMark: (state: SessionState) => void;
  onActual: (actual: Actual) => void;
  onSaveTemplate: (template: Template) => void;
  onRemove: () => void;
  onBack: () => void;
}

const ACTIVITIES: ActivityId[] = ["course", "velo", "natation", "renfo", "autre"];

const field = { border: `1px solid ${LINE}`, background: "#fff", color: INK, fontSize: 16, padding: 8 };

export function SessionView({
  session,
  sessions,
  movements,
  guide,
  css,
  onPatch,
  onItems,
  onDone,
  onMark,
  onActual,
  onSaveTemplate,
  onRemove,
  onBack,
}: Props) {
  const [mode, setMode] = useState<"apercu" | "etapes" | "chrono" | "edit">("apercu");
  const [chrono, setChrono] = useState<ChronoState>(IDLE);
  const [idx, setIdx] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [saved, setSaved] = useState(false);

  // Les chiffres se saisissent librement et ne partent en base qu'une fois le champ quitté.
  const [draft, setDraft] = useState({
    minutes: session.actual?.minutes?.toString() ?? "",
    distance: distanceInput(session.disc, session.actual?.distance),
    avgHr: session.actual?.avgHr?.toString() ?? "",
    maxHr: session.actual?.maxHr?.toString() ?? "",
    calories: session.actual?.calories?.toString() ?? "",
  });

  const color = ACTIVITY[session.disc].c;
  const done = session.done ?? {};
  const previous = useMemo(() => previousDone(sessions, session), [sessions, session]);
  const planned = plannedMinutes(session.items);
  const withChrono = timeable(session.items, session.disc);

  const num = (v: string) => {
    const n = Number(v.replace(",", "."));
    return v.trim() === "" || !Number.isFinite(n) ? undefined : n;
  };

  const commit = () =>
    onActual({
      ...session.actual,
      minutes: num(draft.minutes),
      distance: parseDistance(session.disc, draft.distance),
      avgHr: num(draft.avgHr),
      maxHr: num(draft.maxHr),
      calories: num(draft.calories),
    });

  if (mode === "chrono") {
    return (
      <Chrono
        items={session.items}
        disc={session.disc}
        color={color}
        state={chrono}
        onState={setChrono}
        onBack={() => setMode("apercu")}
        onFinish={() => {
          if (session.state !== "fait") onMark("fait");
          setChrono(IDLE);
          setMode("apercu");
        }}
      />
    );
  }

  if (mode === "etapes") {
    return (
      <SessionStep
        items={session.items}
        idx={idx}
        done={done}
        previous={previous}
        color={color}
        css={css}
        onDone={onDone}
        onMove={setIdx}
        onBack={() => setMode("apercu")}
        onFinish={() => {
          if (session.state !== "fait") onMark("fait");
          setMode("apercu");
        }}
      />
    );
  }

  if (mode === "edit") {
    return (
      <div>
        <button
          onClick={() => setMode("apercu")}
          className="mb-4 text-sm bg-transparent border-none p-0 cursor-pointer"
          style={{ color: MUTED }}
        >
          ← Retour à la séance
        </button>

        <p className="m-0 mb-2 text-sm font-medium">Nom</p>
        <input
          value={session.title}
          onChange={(e) => onPatch({ title: e.target.value })}
          placeholder="Nom de la séance"
          className="w-full mb-4"
          style={field}
        />

        <p className="m-0 mb-2 text-sm font-medium">Discipline</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {ACTIVITIES.map((a) => {
            const on = session.disc === a;
            return (
              <button
                key={a}
                onClick={() => onPatch({ disc: a })}
                className="text-sm px-3 cursor-pointer"
                style={{
                  height: 40,
                  border: `1px solid ${on ? ACTIVITY[a].c : LINE}`,
                  background: on ? ACTIVITY[a].c : "#fff",
                  color: on ? "#fff" : INK,
                }}
              >
                {ACTIVITY[a].label}
              </button>
            );
          })}
        </div>

        <p className="m-0 mb-2 text-sm font-medium">Déroulé</p>
        {session.items.map((item, i) => (
          <ItemEditor
            key={item.id}
            item={item}
            movements={movements}
            first={i === 0}
            last={i === session.items.length - 1}
            onChange={(patch) => onItems(updateItem(session.items, item.id, patch))}
            onRemove={() => onItems(removeItem(session.items, item.id))}
            onMove={(delta) => onItems(moveItem(session.items, item.id, delta))}
          />
        ))}

        <div className="flex gap-2 mb-5">
          {(["reps", "time", "distance"] as const).map((kind) => (
            <button
              key={kind}
              onClick={() => onItems(addItem(session.items, emptyItem(kind)))}
              className="flex-1 text-sm cursor-pointer"
              style={{ height: 44, border: `1px solid ${LINE}`, background: "#fff", color: INK }}
            >
              + {kind === "reps" ? "Exercice" : kind === "time" ? "Durée" : "Distance"}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            onSaveTemplate({
              id: newId(),
              name: session.title || "Séance sans nom",
              disc: session.disc,
              items: session.items,
            });
            setSaved(true);
          }}
          className="w-full text-sm cursor-pointer"
          style={{ height: 44, border: `1px solid ${LINE}`, background: "#fff", color: INK }}
        >
          {saved ? "Enregistré dans tes séances" : "Enregistrer comme modèle réutilisable"}
        </button>
      </div>
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
        <p className="m-0 text-base font-medium">{session.title || "Séance sans nom"}</p>
        <p className="m-0 text-sm" style={{ color: MUTED }}>
          {session.day} {dayLabel(session.week, session.day)}
        </p>
      </div>
      <p className="m-0 mb-4 text-sm" style={{ color }}>
        {ACTIVITY[session.disc].label}
        {planned > 0 ? ` · ${humanDuration(planned)} prévues` : ""}
      </p>

      {session.items.length > 0 && (
        <button
          onClick={() => {
            if (withChrono) return setMode("chrono");
            setIdx(0);
            setMode("etapes");
          }}
          className="w-full mb-5 cursor-pointer border-none"
          style={{ height: 52, background: INK, color: "#fff", fontSize: 16 }}
        >
          {withChrono
            ? chrono.startedAt !== null
              ? "Reprendre le chrono"
              : "Lancer le chrono"
            : "Démarrer la séance"}
        </button>
      )}

      {guide && <SessionGuideView guide={guide} color={color} />}
      {session.disc === "renfo" && (
        <div className="mb-4">
          <Fold title="Choisir ta charge">
            <Points items={LOAD_PRIMER} />
          </Fold>
        </div>
      )}

      <p className="m-0 mb-2 text-sm font-medium">Déroulé</p>
      {session.items.length === 0 && (
        <p className="m-0 mb-3 text-sm" style={{ color: MUTED }}>
          Cette séance n'a pas encore de contenu. Touche « Modifier la séance » pour en ajouter, ou
          note simplement ce que tu as fait plus bas.
        </p>
      )}
      {session.items.map((item, i) => {
        const record = done[item.id];
        const sets = (record?.sets ?? []).filter((s) => s.reps || s.load);
        return (
          <button
            key={item.id}
            onClick={() => {
              setIdx(i);
              setMode("etapes");
            }}
            className="w-full text-left mb-1 p-3 cursor-pointer"
            style={{ background: "#fff", border: "none", borderLeft: `3px solid ${color}` }}
          >
            <div className="flex justify-between items-baseline gap-2">
              <p className="m-0 text-sm font-medium">{item.label || "Sans nom"}</p>
              <p className="m-0 text-xs whitespace-nowrap" style={{ color: MUTED }}>
                {item.kind === "reps"
                  ? `${item.sets ?? "?"} × ${item.reps ?? "?"}`
                  : item.kind === "distance"
                    ? `${item.distance} m`
                    : item.rep
                      ? `${item.rep.n} × ${item.rep.work} min`
                      : `${item.minutes ?? 0} min`}
              </p>
            </div>
            {sets.length > 0 && (
              <p className="m-0 mt-1 text-xs" style={{ color }}>
                {sets.map((s) => `${s.reps ?? "?"} × ${s.load ?? "?"} kg`).join(" · ")}
              </p>
            )}
            {item.note && (
              <p className="m-0 mt-1 text-xs" style={{ color: MUTED }}>
                {withPaces(item.note, css)}
              </p>
            )}
          </button>
        );
      })}

      <button
        onClick={() => setMode("edit")}
        className="w-full mt-2 mb-5 text-sm cursor-pointer"
        style={{ height: 44, border: `1px solid ${LINE}`, background: "#fff", color: INK }}
      >
        Modifier la séance
      </button>

      <p className="m-0 mb-2 text-sm font-medium">Ce que tu as fait</p>
      <div className="p-3 mb-4" style={{ background: "#fff", border: `1px solid ${LINE}` }}>
        <div className="flex gap-2 mb-3">
          <div style={{ flex: 1 }}>
            <p className="m-0 mb-1 text-xs" style={{ color: MUTED }}>
              Durée (min)
            </p>
            <input
              value={draft.minutes}
              onChange={(e) => setDraft({ ...draft, minutes: e.target.value })}
              onBlur={commit}
              inputMode="numeric"
              placeholder={planned > 0 ? String(planned) : ""}
              style={{ ...field, width: "100%" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <p className="m-0 mb-1 text-xs" style={{ color: MUTED }}>
              Distance ({distanceUnit(session.disc)})
            </p>
            <input
              value={draft.distance}
              onChange={(e) => setDraft({ ...draft, distance: e.target.value })}
              onBlur={commit}
              inputMode="decimal"
              style={{ ...field, width: "100%" }}
            />
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          {([
            ["avgHr", "FC moyenne"],
            ["maxHr", "FC max"],
            ["calories", "Calories"],
          ] as const).map(([key, label]) => (
            <div key={key} style={{ flex: 1 }}>
              <p className="m-0 mb-1 text-xs" style={{ color: MUTED }}>
                {label}
              </p>
              <input
                value={draft[key]}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                onBlur={commit}
                inputMode="numeric"
                style={{ ...field, width: "100%" }}
              />
            </div>
          ))}
        </div>

        <p className="m-0 mb-1 text-xs" style={{ color: MUTED }}>
          Effort ressenti
        </p>
        <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: "repeat(10, 1fr)" }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
            const on = session.actual?.rpe === n;
            return (
              <button
                key={n}
                onClick={() => onActual({ ...session.actual, rpe: on ? undefined : n })}
                className="cursor-pointer p-0"
                style={{
                  height: 38,
                  border: `1px solid ${on ? INK : LINE}`,
                  background: on ? INK : "#fff",
                  color: on ? "#fff" : INK,
                  fontSize: 14,
                }}
              >
                {n}
              </button>
            );
          })}
        </div>
        <p className="m-0 mb-3 text-xs" style={{ color: MUTED }}>
          {session.actual?.rpe ? `${session.actual.rpe}/10 : ${rpeLabel(session.actual.rpe)}.` : "1 très facile, 10 maximal."}
        </p>

        <p className="m-0 mb-1 text-xs" style={{ color: MUTED }}>
          Note
        </p>
        <textarea
          value={session.note ?? ""}
          onChange={(e) => onPatch({ note: e.target.value })}
          rows={2}
          placeholder="Sensations, météo, douleur…"
          style={{ ...field, width: "100%", resize: "vertical" }}
        />
      </div>

      <p className="m-0 mb-2 text-sm font-medium">Bilan</p>
      <div className="flex gap-2 mb-5">
        {STATES.map(([id, label]) => (
          <button
            key={id}
            onClick={() => onMark(id)}
            className="flex-1 cursor-pointer"
            style={{
              height: 44,
              border: `1px solid ${session.state === id ? INK : LINE}`,
              background: session.state === id ? INK : "#fff",
              color: session.state === id ? "#fff" : MUTED,
              fontSize: 14,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="pt-4" style={{ borderTop: `1px solid ${LINE}` }}>
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
                onClick={() => !on && onPatch({ day: d })}
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
          {confirming ? "Confirmer la suppression" : "Supprimer cette séance"}
        </button>
      </div>
    </div>
  );
}

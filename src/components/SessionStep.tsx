import { useEffect, useRef, useState } from "react";
import { guidesFor } from "../data/guides";
import type { DoneItem, Item } from "../data/types";
import { clock } from "../engine/rest";
import { useNow } from "../hooks/useNow";
import { useWakeLock } from "../hooks/useWakeLock";
import { chime, tick, unlockAudio } from "../lib/beep";
import { withPaces } from "../lib/swim";
import { ACCENT, CARD, INK, LINE, MUTED, ON_ACCENT, ON_FILL, PAPER, R } from "../theme";
import { ExerciseGuideView } from "./Guide";

interface Props {
  items: Item[];
  idx: number;
  done: Record<string, DoneItem>;
  /** Ce qui avait été soulevé la dernière fois sur le même exercice. */
  previous: Record<string, DoneItem>;
  color: string;
  /** Allure de seuil en natation, pour les consignes qui en parlent. */
  css?: number;
  onDone: (itemId: string, done: DoneItem | undefined) => void;
  onMove: (idx: number) => void;
  onBack: () => void;
  onFinish: () => void;
}

interface Rest {
  endsAt: number;
  next: number;
}

/** Repos par défaut quand l'élément n'en porte pas. */
const DEFAULT_REST = 90;

const number = (v: string) => {
  const n = Number(v.replace(",", "."));
  return v.trim() === "" || !Number.isFinite(n) ? undefined : n;
};

/** Écrit une série dans le relevé, en comblant les séries sautées. */
function withSet(done: DoneItem | undefined, i: number, value: { reps?: number; load?: number } | null) {
  const sets = [...(done?.sets ?? [])];
  while (sets.length <= i) sets.push({});
  sets[i] = value ?? {};
  while (sets.length > 0 && Object.keys(sets[sets.length - 1]).length === 0) sets.pop();
  if (sets.length > 0) return { ...done, sets };
  const rest = { ...done, sets: undefined };
  return rest.minutes === undefined && rest.distance === undefined ? undefined : rest;
}

/**
 * Mode pas-à-pas : un élément par écran. Sur un exercice, on note ce qu'on a réellement
 * soulevé série par série, et cocher lance le repos.
 */
export function SessionStep({
  items,
  idx,
  done,
  previous,
  color,
  css,
  onDone,
  onMove,
  onBack,
  onFinish,
}: Props) {
  const cur = items[Math.min(idx, items.length - 1)];
  const [rest, setRest] = useState<Rest | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
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

  const sets = cur.sets ?? 3;
  const record = done[cur.id];
  const last = previous[cur.movement ?? cur.label];
  const guides = cur.kind === "reps" ? guidesFor(cur.label) : [];
  const restFor = cur.rest ?? DEFAULT_REST;

  const value = (i: number, field: "reps" | "load") => {
    const key = `${cur.id}-${i}-${field}`;
    if (edits[key] !== undefined) return edits[key];
    const recorded = record?.sets?.[i]?.[field];
    if (recorded !== undefined) return String(recorded);
    // À défaut d'un relevé, on propose la prescription, puis la série précédente, puis
    // ce qui avait été fait la dernière fois : une prescription comme « 4-6 » n'est pas un nombre.
    const earlier = (record?.sets ?? [])
      .slice(0, i)
      .reverse()
      .find((s) => s[field] !== undefined)?.[field];
    if (field === "reps") {
      const plain = /^\d+$/.test(cur.reps ?? "") ? (cur.reps as string) : "";
      if (plain) return plain;
    }
    if (earlier !== undefined) return String(earlier);
    const sets = last?.sets ?? [];
    const before = sets[i]?.[field] ?? sets[sets.length - 1]?.[field];
    return before === undefined ? "" : String(before);
  };

  const toggle = (i: number) => {
    unlockAudio();
    const checked = Boolean(record?.sets?.[i] && Object.keys(record.sets[i]).length > 0);
    if (checked) {
      onDone(cur.id, withSet(record, i, null));
      setRest(null);
      return;
    }
    onDone(cur.id, withSet(record, i, { reps: number(value(i, "reps")), load: number(value(i, "load")) }));
    fired.current = false;
    lastTick.current = null;
    setRest(i + 1 < sets ? { endsAt: Date.now() + restFor * 1000, next: i + 2 } : null);
  };

  const move = (to: number) => {
    setRest(null);
    onMove(to);
  };

  const input = {
    width: "100%",
    height: 44,
    border: `1px solid ${LINE}`,
    background: CARD,
    color: INK,
    fontSize: 16,
    textAlign: "center" as const,
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
          {idx + 1} / {items.length}
        </p>
      </div>

      <div className="flex gap-1 mb-6">
        {items.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, background: i <= idx ? color : LINE }} />
        ))}
      </div>

      <p className="m-0 mb-3" style={{ fontSize: 26, fontWeight: 500, lineHeight: 1.15 }}>
        {cur.label}
      </p>

      {cur.kind === "reps" && (
        <>
          <p className="m-0 mb-1" style={{ fontSize: 20, color }}>
            {sets} × {cur.reps ?? "?"}
          </p>
          {cur.load && (
            <p className="m-0 mb-1" style={{ fontSize: 15 }}>
              <span style={{ color: MUTED }}>Charge conseillée · </span>
              {cur.load}
            </p>
          )}
          {last && (
            <p className="m-0 mb-1" style={{ fontSize: 15 }}>
              <span style={{ color: MUTED }}>La dernière fois · </span>
              {(last.sets ?? [])
                .filter((s) => s.reps || s.load)
                .map((s) => `${s.reps ?? "?"} × ${s.load ?? "?"} kg`)
                .join(", ")}
            </p>
          )}
          <p className="m-0 mb-3" style={{ fontSize: 15 }}>
            <span style={{ color: MUTED }}>Repos · </span>
            {clock(restFor)}
          </p>

          <div className="mb-3">
            <div className="flex gap-2 mb-1 text-xs" style={{ color: MUTED }}>
              <span style={{ width: 54 }}>Série</span>
              <span style={{ flex: 1, textAlign: "center" }}>Répétitions</span>
              <span style={{ flex: 1, textAlign: "center" }}>Charge (kg)</span>
              <span style={{ width: 52 }} />
            </div>
            {Array.from({ length: sets }).map((_, i) => {
              const checked = Boolean(record?.sets?.[i] && Object.keys(record.sets[i]).length > 0);
              return (
                <div key={i} className="flex gap-2 mb-1 items-center">
                  <span style={{ width: 54, color: MUTED }}>{i + 1}</span>
                  <input
                    value={value(i, "reps")}
                    onChange={(e) => setEdits((s) => ({ ...s, [`${cur.id}-${i}-reps`]: e.target.value }))}
                    inputMode="numeric"
                    style={{ ...input, flex: 1 }}
                  />
                  <input
                    value={value(i, "load")}
                    onChange={(e) => setEdits((s) => ({ ...s, [`${cur.id}-${i}-load`]: e.target.value }))}
                    inputMode="decimal"
                    style={{ ...input, flex: 1 }}
                  />
                  <button
                    onClick={() => toggle(i)}
                    aria-label={`Série ${i + 1} faite`}
                    className="cursor-pointer"
                    style={{
                      width: 52,
                      height: 44,
                      border: `1px solid ${checked ? color : LINE}`,
                      background: checked ? color : CARD,
                      color: checked ? ON_ACCENT : MUTED,
                      fontSize: 16,
                     borderRadius: R.pill,}}
                  >
                    ✓
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {cur.kind === "time" && (
        <p className="m-0 mb-3" style={{ fontSize: 20, color }}>
          {cur.rep ? `${cur.rep.n} × ${cur.rep.work} min, ${cur.rep.rest} min de récup` : `${cur.minutes ?? 0} min`}
        </p>
      )}
      {cur.kind === "distance" && (
        <p className="m-0 mb-3" style={{ fontSize: 20, color }}>
          {cur.distance} m
        </p>
      )}

      {rest && (
        <div
          className="p-3 mb-3"
          style={{
            background: remaining > 0 ? CARD : color,
            border: `1px solid ${remaining > 0 ? color : "transparent"}`,
            borderRadius: R.card,
            color: remaining > 0 ? INK : ON_FILL,
          }}
        >
          {remaining > 0 ? (
            <>
              <p className="m-0 text-xs" style={{ opacity: 0.8 }}>
                Repos avant la série {rest.next}
              </p>
              <p
                className="m-0 my-1"
                style={{ fontSize: 48, fontWeight: 500, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}
              >
                {clock(remaining)}
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setRest({ ...rest, endsAt: rest.endsAt + 30_000 })}
                  className="flex-1 cursor-pointer"
                  style={{
                      height: 40,
                      borderRadius: R.pill,
                      border: `1px solid ${LINE}`,
                      background: "transparent",
                      color: "inherit",
                    }}
                >
                  + 30 s
                </button>
                <button
                  onClick={() => setRest(null)}
                  className="flex-1 cursor-pointer border-none"
                  style={{ height: 40, borderRadius: R.pill, background: ACCENT, color: ON_ACCENT }}
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
                style={{ height: 40, borderRadius: R.pill, background: ACCENT, color: ON_ACCENT }}
              >
                OK
              </button>
            </div>
          )}
        </div>
      )}

      {cur.note && (
        <p className="m-0 mb-4" style={{ fontSize: 15, color: MUTED, lineHeight: 1.45 }}>
          {withPaces(cur.note, css)}
        </p>
      )}

      {guides.map((g) => (
        <ExerciseGuideView key={g.name} guide={g} titled={guides.length > 1} />
      ))}

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
            background: CARD,
            color: idx === 0 ? LINE : INK,
            fontSize: 15,
           borderRadius: R.field,}}
        >
          Précédent
        </button>
        {idx < items.length - 1 ? (
          <button
            onClick={() => move(idx + 1)}
            className="flex-1 cursor-pointer border-none"
            style={{ height: 52, background: ACCENT, color: ON_ACCENT, fontSize: 16 , borderRadius: R.pill}}
          >
            Suivant
          </button>
        ) : (
          <button
            onClick={onFinish}
            className="flex-1 cursor-pointer border-none"
            style={{ height: 52, background: color, color: ON_FILL, fontSize: 16 }}
          >
            Séance terminée
          </button>
        )}
      </div>
    </div>
  );
}

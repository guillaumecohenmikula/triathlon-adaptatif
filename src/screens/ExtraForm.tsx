import { useState } from "react";
import { Stepper } from "../components/Stepper";
import type { ActivityId, ExtraSession } from "../data/types";
import { newId } from "../engine/week";
import { dayLabel, humanDuration } from "../lib/date";
import { distanceInput, inMeters, parseDistance, rpeLabel } from "../lib/extra";
import { ACTIVITY, INK, LINE, MUTED } from "../theme";

interface Props {
  week: string;
  day: string;
  /** Présent quand on modifie une séance extra déjà notée. */
  initial?: ExtraSession;
  onSave: (extra: ExtraSession) => void;
  onRemove: (id: string) => void;
  onBack: () => void;
}

const ACTIVITIES: ActivityId[] = ["course", "velo", "natation", "renfo", "autre"];

/** Une séance faite hors programme : on la note pour qu'elle compte dans le volume. */
export function ExtraForm({ week, day, initial, onSave, onRemove, onBack }: Props) {
  const [activity, setActivity] = useState<ActivityId>(initial?.activity ?? "course");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [dur, setDur] = useState(initial?.dur ?? 30);
  const [distance, setDistance] = useState(distanceInput(initial?.activity ?? "course", initial?.km));
  const [rpe, setRpe] = useState<number | undefined>(initial?.rpe);
  const [note, setNote] = useState(initial?.note ?? "");
  const [confirming, setConfirming] = useState(false);

  const km = parseDistance(activity, distance);
  const unreadable = distance.trim() !== "" && km === undefined;

  const save = () => {
    // Les champs vides ne sont pas écrits : la synchronisation compare les contenus.
    const extra: ExtraSession = { id: initial?.id ?? newId(), week, day, activity, dur };
    if (label.trim()) extra.label = label.trim();
    if (km !== undefined) extra.km = km;
    if (rpe !== undefined) extra.rpe = rpe;
    if (note.trim()) extra.note = note.trim();
    onSave(extra);
  };

  const field = { border: `1px solid ${LINE}`, background: "#fff", color: INK, fontSize: 16 };

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-sm bg-transparent border-none p-0 cursor-pointer"
        style={{ color: MUTED }}
      >
        ← Retour à la semaine
      </button>

      <p className="m-0 text-base font-medium">Séance faite</p>
      <p className="m-0 mb-4 text-xs" style={{ color: MUTED }}>
        {day} {dayLabel(week, day)} · en dehors du programme, elle compte dans ton volume
      </p>

      <p className="m-0 mb-2 text-sm font-medium">Activité</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {ACTIVITIES.map((a) => {
          const on = activity === a;
          return (
            <button
              key={a}
              onClick={() => setActivity(a)}
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

      <p className="m-0 mb-2 text-sm font-medium">
        {activity === "autre" ? "Laquelle" : "Précision"}{" "}
        <span style={{ color: MUTED, fontWeight: 400 }}>facultatif</span>
      </p>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder={activity === "autre" ? "Marche, foot, rando…" : "Vélotaf, footing du matin…"}
        className="w-full p-2 mb-4"
        style={field}
      />

      <p className="m-0 mb-2 text-sm font-medium">Durée</p>
      <div className="mb-4">
        <Stepper value={dur} onChange={setDur} min={5} max={600} step={5} format={humanDuration} label="Durée" />
      </div>

      <p className="m-0 mb-2 text-sm font-medium">
        Distance <span style={{ color: MUTED, fontWeight: 400 }}>facultatif</span>
      </p>
      <div className="flex items-center gap-2 mb-1">
        <input
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
          inputMode="decimal"
          placeholder={inMeters(activity) ? "1500" : "5,2"}
          className="flex-1 p-2"
          style={field}
        />
        <p className="m-0 text-sm" style={{ color: MUTED, width: 28 }}>
          {inMeters(activity) ? "m" : "km"}
        </p>
      </div>
      <p className="m-0 mb-4 text-xs" style={{ color: unreadable ? "#6B4708" : MUTED }}>
        {unreadable ? "Distance illisible, elle ne sera pas enregistrée." : " "}
      </p>

      <p className="m-0 mb-2 text-sm font-medium">
        Effort ressenti <span style={{ color: MUTED, fontWeight: 400 }}>facultatif</span>
      </p>
      <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: "repeat(10, 1fr)" }}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const on = rpe === n;
          return (
            <button
              key={n}
              onClick={() => setRpe(on ? undefined : n)}
              className="cursor-pointer p-0"
              style={{
                height: 40,
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
      <p className="m-0 mb-4 text-xs" style={{ color: MUTED }}>
        {rpe === undefined ? "1 très facile, 10 maximal." : `${rpe}/10 : ${rpeLabel(rpe)}.`}
      </p>

      <p className="m-0 mb-2 text-sm font-medium">
        Note <span style={{ color: MUTED, fontWeight: 400 }}>facultatif</span>
      </p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="Sensations, météo, douleur…"
        className="w-full p-2 mb-5"
        style={{ ...field, resize: "vertical" }}
      />

      <button
        onClick={save}
        className="w-full cursor-pointer border-none"
        style={{ height: 52, background: INK, color: "#fff", fontSize: 16 }}
      >
        {initial ? "Enregistrer les modifications" : "Enregistrer la séance"}
      </button>

      {initial && (
        <button
          onClick={() => (confirming ? onRemove(initial.id) : setConfirming(true))}
          className="w-full mt-3 cursor-pointer"
          style={{
            height: 44,
            border: `1px solid ${confirming ? "#6B4708" : LINE}`,
            background: "transparent",
            color: confirming ? "#6B4708" : MUTED,
            fontSize: 14,
          }}
        >
          {confirming ? "Confirmer la suppression" : "Supprimer cette séance"}
        </button>
      )}
    </div>
  );
}

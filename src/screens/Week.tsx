import { useState } from "react";
import { SlotEditor } from "../components/SlotEditor";
import type { BlockId } from "../data/blocks";
import { BLOCKS } from "../data/blocks";
import { PROGRESSION, STATES, placeLabel } from "../data/settings";
import type { Discipline, Journal, PlaceId, Phase, PlacedSession } from "../data/types";
import type { Deficits } from "../engine/deficits";
import { frDate } from "../lib/date";
import type { Slots } from "../store/db";
import { DISC, LINE, MUTED, WARN_BG, WARN_TX } from "../theme";

interface Props {
  week: string;
  placed: PlacedSession[];
  dropped: BlockId[];
  /** Blocs libérés par une annulation qu'aucun créneau restant n'a pu absorber. */
  orphans: BlockId[];
  cancelled: string[];
  slots: Slots;
  openPlaces: { id: PlaceId; label: string }[];
  journal: Journal;
  phase: Phase;
  weekInBlock: number;
  def: Deficits;
  slotCount: number;
  onOpen: (day: string) => void;
  onRestore: (day: string) => void;
  onToggleDay: (day: string) => void;
  onSlotChange: (day: string, patch: Partial<{ place: PlaceId; duration: number }>) => void;
}

export function Week({
  week,
  placed,
  dropped,
  orphans,
  cancelled,
  slots,
  openPlaces,
  journal,
  phase,
  weekInBlock,
  def,
  slotCount,
  onOpen,
  onRestore,
  onToggleDay,
  onSlotChange,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const enough = slotCount >= phase.minSlots;
  const lagging = (Object.keys(def.byDisc) as Discipline[]).filter((d) => (def.byDisc[d] ?? 0) > 0.2);

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <p className="m-0 text-sm font-medium">Semaine du {frDate(week)}</p>
        <button
          onClick={() => setEditing((e) => !e)}
          className="text-xs px-3 py-2 cursor-pointer"
          style={{
            border: `1px solid ${editing ? "#12202B" : LINE}`,
            background: editing ? "#12202B" : "#fff",
            color: editing ? "#fff" : "#12202B",
          }}
        >
          {editing ? "Terminé" : "Modifier mes créneaux"}
        </button>
      </div>

      {editing && (
        <SlotEditor
          slots={slots}
          openPlaces={openPlaces}
          onToggleDay={onToggleDay}
          onChange={onSlotChange}
        />
      )}

      {!editing && placed.length === 0 && (
        <p className="text-sm mb-4" style={{ color: MUTED }}>
          {slotCount === 0
            ? "Aucun créneau cette semaine. Touche « Modifier mes créneaux » pour en ajouter."
            : "Plus rien de prévu sur les jours qui restent."}
        </p>
      )}

      {!editing &&
        placed.map((s) => {
          const st = journal[`${week}|${s.day}`]?.state;
          const c = DISC[BLOCKS[s.blocks[0].id].disc].c;
          return (
            <button
              key={s.day}
              onClick={() => onOpen(s.day)}
              className="w-full text-left mb-2 p-3 cursor-pointer"
              style={{
                background: "#fff",
                border: "none",
                borderLeft: `3px solid ${c}`,
                opacity: st === "fait" ? 0.55 : 1,
              }}
            >
              <div className="flex justify-between items-baseline mb-1">
                <p className="m-0 text-sm font-medium">{s.day}</p>
                <p className="m-0 text-xs" style={{ color: MUTED }}>
                  {st ? `${STATES.find((x) => x[0] === st)![1].toLowerCase()} · ` : ""}
                  {s.blocks.reduce((a, b) => a + b.dur, 0)} min
                </p>
              </div>
              <p className="m-0 text-sm" style={{ color: c }}>
                {s.blocks.map((b) => BLOCKS[b.id].label).join(" + ")}
              </p>
              <p className="m-0 mt-1 text-xs" style={{ color: MUTED }}>
                {placeLabel(s.place)}
              </p>
            </button>
          );
        })}

      {!editing && orphans.length > 0 && (
        <div className="p-3 mb-2 text-sm" style={{ background: WARN_BG, color: WARN_TX }}>
          Pas de place cette semaine pour {orphans.map((id) => BLOCKS[id].label.toLowerCase()).join(", ")}.
          Le volume manquant sera rattrapé la semaine prochaine.
        </div>
      )}

      {!editing &&
        cancelled.map((day) => (
          <div
            key={day}
            className="flex justify-between items-center mb-2 p-3"
            style={{ border: `1px dashed ${LINE}` }}
          >
            <p className="m-0 text-sm" style={{ color: MUTED }}>
              {day} · annulé
            </p>
            <button
              onClick={() => onRestore(day)}
              className="text-xs px-3 py-2 cursor-pointer"
              style={{ border: `1px solid ${LINE}`, background: "#fff", color: "#12202B" }}
            >
              Rétablir
            </button>
          </div>
        ))}

      <button
        onClick={() => setShowInfo((v) => !v)}
        className="w-full text-left mt-3 p-3 cursor-pointer"
        style={{ background: "transparent", border: `1px solid ${LINE}` }}
      >
        <p className="m-0 text-xs" style={{ color: enough ? MUTED : WARN_TX }}>
          {enough
            ? `${slotCount} créneaux — calage correct`
            : `${slotCount} créneau${slotCount > 1 ? "x" : ""} — il en faut ${phase.minSlots}`}
          {" · "}
          {showInfo ? "masquer le détail" : "voir le détail"}
        </p>
      </button>

      {showInfo && (
        <div
          className="p-3 mt-2 text-xs"
          style={{ background: "#fff", border: `1px solid ${LINE}`, color: MUTED }}
        >
          <p className="m-0 mb-2">{PROGRESSION[weekInBlock]}</p>
          {def.weeks > 0 && lagging.length > 0 && (
            <p className="m-0 mb-2">
              Compensation : {lagging.map((d) => DISC[d].label.toLowerCase()).join(", ")} en retard sur{" "}
              {def.weeks} semaine{def.weeks > 1 ? "s" : ""}, donc priorisé cette semaine.
            </p>
          )}
          {dropped.length > 0 && (
            <p className="m-0">Écarté : {dropped.map((id) => BLOCKS[id].label).join(", ")}.</p>
          )}
        </div>
      )}
    </div>
  );
}

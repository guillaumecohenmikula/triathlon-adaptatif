import { DAYS, DURATIONS } from "../data/settings";
import type { PlaceId } from "../data/types";
import { dayLabel } from "../lib/date";
import type { Slots } from "../store/db";
import { INK, LINE, MUTED } from "../theme";

interface Props {
  week: string;
  slots: Slots;
  openPlaces: { id: PlaceId; label: string }[];
  onToggleDay: (day: string) => void;
  onChange: (day: string, patch: Partial<{ place: PlaceId; duration: number }>) => void;
}

/** Le seul input hebdomadaire : quels jours, où, et combien de temps. */
export function SlotEditor({ week, slots, openPlaces, onToggleDay, onChange }: Props) {
  return (
    <div className="grid grid-cols-1 gap-2 mb-4">
      {DAYS.map((d) => {
        const on = Boolean(slots[d]);
        return (
          <div
            key={d}
            className="p-2"
            style={{ background: on ? "#fff" : "transparent", border: `1px solid ${LINE}` }}
          >
            <button
              onClick={() => onToggleDay(d)}
              className="w-full text-left text-sm bg-transparent border-none p-0 cursor-pointer"
              style={{ color: on ? INK : MUTED, fontWeight: on ? 500 : 400 }}
            >
              {on ? "✓ " : "+ "}
              {d} <span style={{ color: MUTED, fontWeight: 400 }}>{dayLabel(week, d)}</span>
            </button>
            {on && (
              <div className="flex gap-2 mt-2">
                <select
                  value={slots[d].place}
                  onChange={(e) => onChange(d, { place: e.target.value as PlaceId })}
                  className="text-sm p-2 flex-1"
                  style={{ border: `1px solid ${LINE}`, background: "#fff", color: INK }}
                >
                  {openPlaces.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <select
                  value={slots[d].duration}
                  onChange={(e) => onChange(d, { duration: Number(e.target.value) })}
                  className="text-sm p-2"
                  style={{ border: `1px solid ${LINE}`, background: "#fff", color: INK }}
                >
                  {DURATIONS.map((v) => (
                    <option key={v} value={v}>
                      {v} min
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

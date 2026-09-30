import { WeekPicker } from "../components/WeekPicker";
import { DAYS, STATES } from "../data/settings";
import type { Session } from "../data/types";
import type { Signal } from "../engine/advice";
import { plannedMinutes, sessionDistance, sessionMinutes } from "../engine/session";
import { dayLabel, humanDuration, isToday } from "../lib/date";
import { formatDistance } from "../lib/extra";
import { ACTIVITY, INK, LINE, MUTED, WARN_BG, WARN_TX } from "../theme";

interface Props {
  week: string;
  offset: number;
  canGoBack: boolean;
  canGoForward: boolean;
  /** Les séances de la semaine affichée. */
  sessions: Session[];
  /** Un signal au plus : le reste vit dans l'onglet Mesures. */
  signal?: Signal;
  onGoWeek: (delta: number) => void;
  onBackToCurrent: () => void;
  onOpen: (id: string) => void;
  onAdd: (day: string) => void;
}

/** La semaine du carnet : ce qui est prévu, ce qui a été fait, jour par jour. */
export function Week({
  week,
  offset,
  canGoBack,
  canGoForward,
  sessions,
  signal,
  onGoWeek,
  onBackToCurrent,
  onOpen,
  onAdd,
}: Props) {
  const done = sessions.filter((s) => s.state === "fait" || s.state === "partiel");
  const minutes = done.reduce((a, s) => a + sessionMinutes(s), 0);

  return (
    <div>
      <WeekPicker
        week={week}
        offset={offset}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onGo={onGoWeek}
        onBackToCurrent={onBackToCurrent}
      />

      <p className="m-0 mb-3 p-3 text-xs" style={{ border: `1px solid ${LINE}`, color: MUTED }}>
        {sessions.length === 0
          ? "Aucune séance cette semaine"
          : `${sessions.length} séance${sessions.length > 1 ? "s" : ""} · ${done.length} faite${done.length > 1 ? "s" : ""}`}
        {minutes > 0 ? ` · ${humanDuration(Math.round(minutes))}` : ""}
      </p>

      {signal && (
        <div
          className="p-3 mb-3 text-sm"
          style={
            signal.tone === "warn"
              ? { background: WARN_BG, color: WARN_TX }
              : { background: "#fff", border: `1px solid ${LINE}`, color: MUTED }
          }
        >
          {signal.text}
        </div>
      )}

      {DAYS.map((day) => {
        const daySessions = sessions.filter((s) => s.day === day);
        const today = isToday(week, day);

        return (
          <div key={day} className="mb-2" style={{ border: `1px solid ${today ? INK : LINE}` }}>
            <div className="flex items-center justify-between pl-3">
              <p className="m-0 text-sm font-medium">
                {day}{" "}
                <span style={{ color: MUTED, fontWeight: 400 }}>
                  {dayLabel(week, day)}
                  {today ? " · aujourd'hui" : ""}
                </span>
              </p>
              <button
                onClick={() => onAdd(day)}
                aria-label={`Ajouter ${day}`}
                className="cursor-pointer"
                style={{
                  width: 52,
                  height: 44,
                  border: "none",
                  borderLeft: `1px solid ${LINE}`,
                  background: "transparent",
                  color: INK,
                  fontSize: 22,
                }}
              >
                +
              </button>
            </div>

            {daySessions.length > 0 && (
              <div className="px-2 pb-2">
                {daySessions.map((s) => {
                  const color = ACTIVITY[s.disc].c;
                  const distance = sessionDistance(s);
                  const state = STATES.find((x) => x[0] === s.state);
                  const shown = s.actual?.minutes ?? plannedMinutes(s.items);
                  return (
                    <button
                      key={s.id}
                      onClick={() => onOpen(s.id)}
                      className="w-full text-left mb-1 p-3 cursor-pointer"
                      style={{
                        background: "#fff",
                        border: "none",
                        borderLeft: `3px solid ${color}`,
                        opacity: s.state === "fait" ? 0.7 : 1,
                      }}
                    >
                      <div className="flex justify-between items-baseline gap-2">
                        <p className="m-0 text-sm" style={{ color }}>
                          {s.title || ACTIVITY[s.disc].label}
                        </p>
                        <p className="m-0 text-xs whitespace-nowrap" style={{ color: MUTED }}>
                          {state ? `${state[1].toLowerCase()} · ` : ""}
                          {shown > 0 ? `${Math.round(shown)} min` : ""}
                        </p>
                      </div>
                      <p className="m-0 mt-1 text-xs" style={{ color: MUTED }}>
                        {[
                          ACTIVITY[s.disc].label,
                          distance > 0 ? formatDistance(s.disc, distance) : null,
                          s.actual?.avgHr ? `${s.actual.avgHr} bpm` : null,
                          s.actual?.rpe ? `effort ${s.actual.rpe}/10` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

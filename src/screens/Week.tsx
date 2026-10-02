import { WeekPicker } from "../components/WeekPicker";
import { DAYS, STATES } from "../data/settings";
import type { Session } from "../data/types";
import type { Signal } from "../engine/advice";
import { plannedMinutes, sessionDistance, sessionMinutes } from "../engine/session";
import { dayLabel, humanDuration, isToday } from "../lib/date";
import { formatDistance } from "../lib/extra";
import { ACCENT, ACTIVITY, CARD, INK, LINE, MUTED, R, WARN_BG, WARN_TX } from "../theme";

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

      <div className="flex gap-1 mb-3" style={{ height: 6 }}>
        {DAYS.map((day) => {
          const first = sessions.find((s) => s.day === day);
          const done = first?.state === "fait" || first?.state === "partiel";
          return (
            <div
              key={day}
              style={{
                flex: 1,
                height: 6,
                borderRadius: R.pill,
                background: first ? ACTIVITY[first.disc].c : LINE,
                opacity: first && !done ? 0.45 : 1,
              }}
            />
          );
        })}
      </div>

      <p className="m-0 mb-3 text-xs" style={{ color: MUTED }}>
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
              : { background: CARD, border: `1px solid ${LINE}`, color: MUTED }
          }
        >
          {signal.text}
        </div>
      )}

      {DAYS.map((day) => {
        const daySessions = sessions.filter((s) => s.day === day);
        const today = isToday(week, day);

        return (
          <div key={day} className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <p
                className="m-0 text-xs"
                style={{
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: today ? ACCENT : MUTED,
                  fontWeight: today ? 600 : 400,
                }}
              >
                {day} {dayLabel(week, day)}
                {today ? " · aujourd'hui" : ""}
              </p>
              <button
                onClick={() => onAdd(day)}
                aria-label={`Ajouter ${day}`}
                className="cursor-pointer"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: R.pill,
                  border: `1px solid ${LINE}`,
                  background: CARD,
                  color: INK,
                  fontSize: 18,
                  lineHeight: 1,
                }}
              >
                +
              </button>
            </div>

            {daySessions.map((s) => {
              const color = ACTIVITY[s.disc].c;
              const distance = sessionDistance(s);
              const state = STATES.find((x) => x[0] === s.state);
              const shown = Math.round(s.actual?.minutes ?? plannedMinutes(s.items));
              const done = s.state === "fait" || s.state === "partiel";
              return (
                <button
                  key={s.id}
                  onClick={() => onOpen(s.id)}
                  className="w-full text-left mb-2 p-3 cursor-pointer"
                  style={{
                    background: CARD,
                    border: `1px solid ${LINE}`,
                    borderRadius: R.card,
                    color: INK,
                    opacity: done ? 0.78 : 1,
                  }}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div style={{ minWidth: 0 }}>
                      <p className="m-0 text-base font-medium">
                        <span
                          style={{
                            display: "inline-block",
                            width: 8,
                            height: 8,
                            borderRadius: R.pill,
                            background: color,
                            marginRight: 8,
                            verticalAlign: "middle",
                          }}
                        />
                        {s.title || ACTIVITY[s.disc].label}
                      </p>
                      <p className="m-0 mt-2 text-xs" style={{ color: MUTED }}>
                        {[
                          ACTIVITY[s.disc].label,
                          distance > 0 ? formatDistance(s.disc, distance) : null,
                          s.actual?.avgHr ? `${s.actual.avgHr} bpm` : null,
                          s.actual?.rpe ? `effort ${s.actual.rpe}/10` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <div className="text-right" style={{ flexShrink: 0 }}>
                      {shown > 0 && (
                        <p
                          className="m-0"
                          style={{
                            fontSize: 22,
                            fontWeight: 700,
                            lineHeight: 1,
                            letterSpacing: "-0.02em",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {shown}
                          <span style={{ fontSize: 12, fontWeight: 400, color: MUTED }}> min</span>
                        </p>
                      )}
                      <p
                        className="m-0 mt-1 text-xs"
                        style={{
                          color: done ? color : MUTED,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        {state ? state[1] : "prévu"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

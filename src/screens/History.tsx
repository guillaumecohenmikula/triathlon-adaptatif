import { BLOCKS } from "../data/blocks";
import { DAYS, STATES, WEIGHT } from "../data/settings";
import type { ActivityId, ExtraSession, Journal } from "../data/types";
import { WeightTracker } from "../components/WeightTracker";
import { dayLabel, frDate, humanDuration } from "../lib/date";
import { formatDistance } from "../lib/extra";
import type { WeightRow } from "../store/db";
import { ACTIVITY, INK, LINE, MUTED } from "../theme";

interface Line {
  key: string;
  day: string;
  text: string;
  muted: boolean;
}

interface WeekSummary {
  week: string;
  lines: Line[];
  byActivity: Partial<Record<ActivityId, number>>;
  total: number;
  /** Séances du programme faites, même partiellement, sur celles qui ont un bilan. */
  done: number;
  marked: number;
  extras: number;
}

/** Agrège bilans et séances extra par semaine, la plus récente en premier. */
export function summarize(journal: Journal, extras: ExtraSession[]): WeekSummary[] {
  const byWeek: Record<string, WeekSummary> = {};
  const of = (week: string) =>
    (byWeek[week] ??= { week, lines: [], byActivity: {}, total: 0, done: 0, marked: 0, extras: 0 });
  const count = (w: WeekSummary, a: ActivityId, minutes: number) => {
    w.byActivity[a] = (w.byActivity[a] ?? 0) + minutes;
    w.total += minutes;
  };

  Object.entries(journal).forEach(([key, e]) => {
    const w = of(e.week);
    w.marked += 1;
    if (e.state !== "rate") w.done += 1;
    e.blocks.forEach((b) => count(w, BLOCKS[b.id].disc, b.dur * (WEIGHT[e.state] ?? 0)));
    w.lines.push({
      key,
      day: e.day,
      text: `${e.blocks.map((b) => BLOCKS[b.id].label).join(" + ")} · ${STATES.find((s) => s[0] === e.state)![1].toLowerCase()}`,
      muted: e.state === "rate",
    });
  });

  extras.forEach((x) => {
    const w = of(x.week);
    w.extras += 1;
    count(w, x.activity, x.dur);
    const name =
      x.activity === "autre"
        ? (x.label ?? ACTIVITY.autre.label)
        : `${ACTIVITY[x.activity].label}${x.label ? ` (${x.label})` : ""}`;
    const details = [
      `${x.dur} min`,
      x.km !== undefined ? formatDistance(x.activity, x.km) : null,
      x.rpe !== undefined ? `effort ${x.rpe}/10` : null,
    ]
      .filter(Boolean)
      .join(", ");
    w.lines.push({ key: x.id, day: x.day, text: `${name}, ${details} · extra`, muted: false });
  });

  const weeks = Object.values(byWeek);
  weeks.forEach((w) => w.lines.sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day)));
  return weeks.sort((a, b) => (a.week < b.week ? 1 : -1));
}

interface Props {
  journal: Journal;
  extras: ExtraSession[];
  week: string;
  weights: WeightRow[];
  onRecordWeight: (week: string, kg: number) => void;
}

export function History({ journal, extras, week, weights, onRecordWeight }: Props) {
  const history = summarize(journal, extras);

  return (
    <div>
      <WeightTracker weights={weights} week={week} onRecord={onRecordWeight} />

      {history.length === 0 && (
        <p className="text-sm" style={{ color: MUTED }}>
          Rien pour l'instant. Fais le bilan de tes séances ou note une séance extra, elles
          s'accumulent ici.
        </p>
      )}

      {history.map((w) => (
        <div key={w.week} className="mb-3 p-3" style={{ background: "#fff", border: `1px solid ${LINE}` }}>
          <div className="flex justify-between mb-2">
            <p className="m-0 text-sm font-medium">
              Semaine du {frDate(w.week)}
              {w.week === week ? " · en cours" : ""}
            </p>
            <p className="m-0 text-xs" style={{ color: MUTED }}>
              {[
                w.marked > 0 ? `${w.done}/${w.marked} du programme` : null,
                w.extras > 0 ? `${w.extras} extra` : null,
                humanDuration(Math.round(w.total)),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>

          {w.total > 0 && (
            <div className="flex mb-2" style={{ height: 8 }}>
              {(Object.keys(w.byActivity) as ActivityId[]).map((a) => (
                <div
                  key={a}
                  style={{
                    width: `${((w.byActivity[a] ?? 0) / w.total) * 100}%`,
                    background: ACTIVITY[a].c,
                  }}
                />
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-2">
            {(Object.keys(w.byActivity) as ActivityId[]).map((a) => (
              <span key={a} className="text-xs" style={{ color: ACTIVITY[a].c }}>
                {ACTIVITY[a].label} {Math.round(w.byActivity[a] ?? 0)} min
              </span>
            ))}
          </div>

          {w.lines.map((l) => (
            <p key={l.key} className="m-0 text-xs" style={{ color: l.muted ? MUTED : INK }}>
              {l.day} {dayLabel(w.week, l.day)} · {l.text}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

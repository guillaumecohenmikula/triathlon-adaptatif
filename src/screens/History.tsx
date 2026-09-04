import { BLOCKS } from "../data/blocks";
import { STATES, WEIGHT } from "../data/settings";
import type { Discipline, Journal, JournalEntry } from "../data/types";
import { dayLabel, frDate } from "../lib/date";
import { DISC, INK, LINE, MUTED } from "../theme";

interface WeekSummary {
  week: string;
  entries: JournalEntry[];
  byDisc: Partial<Record<Discipline, number>>;
  total: number;
  done: number;
}

/** Agrège le journal par semaine, la plus récente en premier. */
export function summarize(journal: Journal): WeekSummary[] {
  const byWeek: Record<string, WeekSummary> = {};
  Object.values(journal).forEach((e) => {
    const w = (byWeek[e.week] ??= { week: e.week, entries: [], byDisc: {}, total: 0, done: 0 });
    w.entries.push(e);
    if (e.state !== "rate") w.done += 1;
    e.blocks.forEach((b) => {
      const m = b.dur * (WEIGHT[e.state] ?? 0);
      const d = BLOCKS[b.id].disc;
      w.byDisc[d] = (w.byDisc[d] ?? 0) + m;
      w.total += m;
    });
  });
  return Object.values(byWeek).sort((a, b) => (a.week < b.week ? 1 : -1));
}

export function History({ journal, week }: { journal: Journal; week: string }) {
  const history = summarize(journal);

  if (history.length === 0) {
    return (
      <p className="text-sm" style={{ color: MUTED }}>
        Rien pour l'instant. Marque tes séances et elles s'accumulent ici.
      </p>
    );
  }

  return (
    <div>
      {history.map((w) => (
        <div key={w.week} className="mb-3 p-3" style={{ background: "#fff", border: `1px solid ${LINE}` }}>
          <div className="flex justify-between mb-2">
            <p className="m-0 text-sm font-medium">
              Semaine du {frDate(w.week)}
              {w.week === week ? " · en cours" : ""}
            </p>
            <p className="m-0 text-xs" style={{ color: MUTED }}>
              {w.done}/{w.entries.length} séances · {Math.round(w.total)} min
            </p>
          </div>

          {w.total > 0 && (
            <div className="flex mb-2" style={{ height: 8 }}>
              {(Object.keys(w.byDisc) as Discipline[]).map((d) => (
                <div
                  key={d}
                  style={{ width: `${((w.byDisc[d] ?? 0) / w.total) * 100}%`, background: DISC[d].c }}
                />
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-2">
            {(Object.keys(w.byDisc) as Discipline[]).map((d) => (
              <span key={d} className="text-xs" style={{ color: DISC[d].c }}>
                {DISC[d].label} {Math.round(w.byDisc[d] ?? 0)} min
              </span>
            ))}
          </div>

          {w.entries.map((e) => (
            <p
              key={e.day}
              className="m-0 text-xs"
              style={{ color: e.state === "rate" ? MUTED : INK }}
            >
              {e.day} {dayLabel(w.week, e.day)} ·{" "}
              {e.blocks.map((b) => BLOCKS[b.id].label).join(" + ")} ·{" "}
              {STATES.find((s) => s[0] === e.state)![1].toLowerCase()}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

import { WeightTracker } from "../components/WeightTracker";
import type { ActivityId, Session } from "../data/types";
import type { Signal } from "../engine/advice";
import { shares } from "../engine/advice";
import type { PacePoint, WeekStat } from "../engine/kpi";
import { heart, movements, paceUnit, paces, streak, weekly } from "../engine/kpi";
import { frDate, humanDuration, shiftWeek } from "../lib/date";
import { formatPaceValue } from "../lib/extra";
import type { WeightRow } from "../store/db";
import { ACTIVITY, INK, LINE, MUTED, PAPER, WARN_BG, WARN_TX } from "../theme";

interface Props {
  sessions: Session[];
  signals: Signal[];
  currentWeek: string;
  weights: WeightRow[];
  onRecordWeight: (week: string, kg: number) => void;
}

const ORDER: ActivityId[] = ["course", "velo", "natation", "renfo", "autre"];
const WEEKS_SHOWN = 12;

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-5">
    <p className="m-0 mb-2 text-sm font-medium">{title}</p>
    {children}
  </div>
);

/** Volume par semaine, empilé par discipline. Un trait de fond sépare les segments. */
function VolumeBars({ stats }: { stats: WeekStat[] }) {
  const max = Math.max(...stats.map((s) => s.minutes), 1);
  return (
    <div className="p-3" style={{ background: "#fff", border: `1px solid ${LINE}` }}>
      <div className="flex items-end gap-1" style={{ height: 120 }}>
        {stats.map((s) => (
          <div key={s.week} className="flex-1 flex flex-col justify-end" style={{ height: "100%" }}>
            <div
              className="flex flex-col-reverse"
              style={{ height: `${(s.minutes / max) * 100}%`, minHeight: 2, gap: 2 }}
            >
              {ORDER.filter((d) => (s.byDisc[d] ?? 0) > 0).map((d) => (
                <div
                  key={d}
                  style={{ flexGrow: s.byDisc[d], background: ACTIVITY[d].c, minHeight: 2 }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-1 mt-1">
        {stats.map((s, i) => (
          <p
            key={s.week}
            className="m-0 flex-1 text-center"
            style={{ fontSize: 9, color: MUTED }}
          >
            {i === 0 || i === stats.length - 1 ? frDate(s.week).replace(/\.$/, "") : ""}
          </p>
        ))}
      </div>
    </div>
  );
}

/** Allure au fil du temps. Une seule série, donc pas de légende : le titre la nomme. */
function PaceLine({ points, disc }: { points: PacePoint[]; disc: ActivityId }) {
  const W = 320;
  const H = 90;
  const PAD = 12;
  const values = points.map((p) => p.pace);
  const lo = Math.min(...values) * 0.97;
  const hi = Math.max(...values) * 1.03;
  const span = hi - lo || 1;
  const x = (i: number) => PAD + (i * (W - PAD * 2)) / Math.max(1, points.length - 1);
  // Axe inversé : plus c'est rapide, plus c'est haut.
  const y = (v: number) => PAD + ((v - lo) / span) * (H - PAD * 2);
  const last = points[points.length - 1];
  const best = Math.min(...values);

  return (
    <div className="p-3" style={{ background: "#fff", border: `1px solid ${LINE}` }}>
      <div className="flex justify-between items-baseline mb-1">
        <p className="m-0 text-sm" style={{ color: ACTIVITY[disc].c }}>
          {ACTIVITY[disc].label}
        </p>
        <p className="m-0 text-xs" style={{ color: MUTED }}>
          meilleure {formatPaceValue(best)}/{paceUnit(disc) === 100 ? "100m" : "km"}
        </p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="Allure">
        <polyline
          points={points.map((p, i) => `${x(i)},${y(p.pace)}`).join(" ")}
          fill="none"
          stroke={ACTIVITY[disc].c}
          strokeWidth={2}
        />
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.pace)} r={4} fill={ACTIVITY[disc].c} />
        ))}
        <circle cx={x(points.length - 1)} cy={y(last.pace)} r={5} fill={ACTIVITY[disc].c} stroke={PAPER} strokeWidth={2} />
        <text
          x={W - PAD}
          y={y(last.pace) - 8}
          textAnchor="end"
          fill={INK}
          style={{ fontSize: 12, fontWeight: 500 }}
        >
          {formatPaceValue(last.pace)}
        </text>
      </svg>
    </div>
  );
}

/** La partie mesure : ce que le carnet sait dire de l'entraînement réellement fait. */
export function Measures({ sessions, signals, currentWeek, weights, onRecordWeight }: Props) {
  const stats = weekly(sessions);
  const recent = [...stats].reverse().slice(-WEEKS_SHOWN);
  const current = stats.find((s) => s.week === currentWeek);
  const run = streak(stats, currentWeek, shiftWeek(currentWeek, -1));
  const part = shares(sessions);
  const lifts = movements(sessions);
  const hr = heart(sessions);
  const total = Object.values(part).reduce((a, v) => a + v, 0);

  return (
    <div>
      {signals.map((s) => (
        <div
          key={s.id}
          className="p-3 mb-2 text-sm"
          style={
            s.tone === "warn"
              ? { background: WARN_BG, color: WARN_TX }
              : { background: "#fff", border: `1px solid ${LINE}`, color: MUTED }
          }
        >
          {s.text}
        </div>
      ))}

      {stats.length === 0 && (
        <p className="text-sm" style={{ color: MUTED }}>
          Rien à mesurer pour l'instant. Note tes séances, les indicateurs se remplissent tout
          seuls.
        </p>
      )}

      {stats.length > 0 && (
        <>
          <div className="flex gap-2 mb-5">
            {[
              ["Cette semaine", current ? humanDuration(Math.round(current.minutes)) : "0 min"],
              ["Séances", String(current?.sessions ?? 0)],
              ["Semaines de suite", String(run)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex-1 p-3"
                style={{ background: "#fff", border: `1px solid ${LINE}` }}
              >
                <p className="m-0" style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.1 }}>
                  {value}
                </p>
                <p className="m-0 mt-1 text-xs" style={{ color: MUTED }}>
                  {label}
                </p>
              </div>
            ))}
          </div>

          <Section title="Volume par semaine">
            <VolumeBars stats={recent} />
            <div className="flex flex-wrap gap-3 mt-2">
              {ORDER.filter((d) => (part[d] ?? 0) > 0).map((d) => (
                <span key={d} className="text-xs" style={{ color: MUTED }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 10,
                      height: 10,
                      background: ACTIVITY[d].c,
                      marginRight: 6,
                    }}
                  />
                  {ACTIVITY[d].label} {Math.round(((part[d] ?? 0) / total) * 100)} %
                </span>
              ))}
            </div>
          </Section>

          <Section title="Semaine par semaine">
            <div className="p-3" style={{ background: "#fff", border: `1px solid ${LINE}` }}>
              {stats.slice(0, 8).map((s) => (
                <div key={s.week} className="flex justify-between text-xs mb-1">
                  <span style={{ color: s.week === currentWeek ? INK : MUTED }}>
                    Semaine du {frDate(s.week)}
                  </span>
                  <span style={{ color: MUTED }}>
                    {s.sessions} séance{s.sessions > 1 ? "s" : ""} ·{" "}
                    {humanDuration(Math.round(s.minutes))}
                    {s.hasLoad ? ` · charge ${Math.round(s.load)}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {(["course", "velo", "natation"] as ActivityId[]).map((disc) => {
            const points = paces(sessions, disc);
            if (points.length < 2) return null;
            return (
              <Section key={disc} title={`Allure en ${ACTIVITY[disc].label.toLowerCase()}`}>
                <PaceLine points={points.slice(-10)} disc={disc} />
              </Section>
            );
          })}

          {lifts.length > 0 && (
            <Section title="Charges en renfo">
              <div className="p-3" style={{ background: "#fff", border: `1px solid ${LINE}` }}>
                {lifts.slice(0, 12).map((m) => (
                  <div key={m.movement} className="flex justify-between text-xs mb-1">
                    <span>{m.label}</span>
                    <span style={{ color: MUTED }}>
                      {m.best ? `record estimé ${m.best} kg · ` : ""}
                      {Math.round(m.volume).toLocaleString("fr-FR")} kg soulevés
                    </span>
                  </div>
                ))}
                <p className="m-0 mt-2 text-xs" style={{ color: MUTED }}>
                  Le record est estimé à partir de tes séries, il ne se teste pas.
                </p>
              </div>
            </Section>
          )}

          {hr && (
            <Section title="Fréquence cardiaque">
              <div className="p-3 text-xs" style={{ background: "#fff", border: `1px solid ${LINE}`, color: MUTED }}>
                {hr.avgHr} bpm en moyenne sur {hr.sessions} séance{hr.sessions > 1 ? "s" : ""}, maximum
                relevé {hr.maxHr} bpm.
              </div>
            </Section>
          )}
        </>
      )}

      <Section title="Poids">
        <WeightTracker weights={weights} week={currentWeek} onRecord={onRecordWeight} />
      </Section>
    </div>
  );
}

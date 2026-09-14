import { useState } from "react";
import { WeekPicker } from "../components/WeekPicker";
import { BLOCKS } from "../data/blocks";
import { DAYS, PROGRESSION, STATES, placeLabel } from "../data/settings";
import type {
  Discipline,
  ExtraSession,
  Journal,
  Phase,
  PlannedSession,
  Targets,
} from "../data/types";
import { intensityMix, minutesOf, plannedByDiscipline } from "../engine/week";
import { dayLabel, humanDuration, isFuture, isToday } from "../lib/date";
import { formatDistance } from "../lib/extra";
import { journalKey } from "../store/db";
import { ACTIVITY, DISC, INK, LINE, MUTED, WARN_BG, WARN_TX } from "../theme";

interface Props {
  week: string;
  offset: number;
  canGoBack: boolean;
  canGoForward: boolean;
  sessions: PlannedSession[];
  /** Séances extra de la semaine affichée. */
  extras: ExtraSession[];
  journal: Journal;
  phase: Phase;
  weekInBlock: number;
  easyWeek: boolean;
  /** Disciplines en retard, et sur combien de semaines terminées le calcul porte. */
  late: Discipline[];
  lateWeeks: number;
  targets: Targets;
  onGoWeek: (delta: number) => void;
  onBackToCurrent: () => void;
  onOpenSession: (id: string) => void;
  onProgram: (day: string) => void;
  onAddExtra: (day: string) => void;
  onOpenExtra: (id: string) => void;
}

const ORDER: Discipline[] = ["course", "velo", "natation", "renfo"];

/** La semaine, jour par jour. Chaque jour se remplit à la main, rien n'est posé d'office. */
export function Week({
  week,
  offset,
  canGoBack,
  canGoForward,
  sessions,
  extras,
  journal,
  phase,
  weekInBlock,
  easyWeek,
  late,
  lateWeeks,
  targets,
  onGoWeek,
  onBackToCurrent,
  onOpenSession,
  onProgram,
  onAddExtra,
  onOpenExtra,
}: Props) {
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [showAdvice, setShowAdvice] = useState(false);

  const planned = sessions.reduce((a, s) => a + minutesOf(s), 0);
  const mix = intensityMix(sessions);
  const byDisc = plannedByDiscipline(sessions);
  const targetTotal = Object.values(targets).reduce((a, v) => a + v, 0);
  const enough = sessions.length >= phase.minSlots;
  const empty = sessions.length === 0 && extras.length === 0;

  const summary = [
    sessions.length === 0
      ? "Aucune séance programmée"
      : `${sessions.length} séance${sessions.length > 1 ? "s" : ""} programmée${sessions.length > 1 ? "s" : ""}`,
    planned > 0 ? humanDuration(planned) : null,
    extras.length > 0 ? `${extras.length} extra` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const add = (day: string) => {
    // Un jour à venir ne peut recevoir qu'une séance programmée : pas de choix à proposer.
    if (isFuture(week, day)) return onProgram(day);
    setOpenDay(openDay === day ? null : day);
  };

  return (
    <div>
      <WeekPicker
        week={week}
        offset={offset}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onGo={(delta) => {
          setOpenDay(null);
          onGoWeek(delta);
        }}
        onBackToCurrent={onBackToCurrent}
      />

      <button
        onClick={() => setShowAdvice((v) => !v)}
        className="w-full text-left mb-2 p-3 cursor-pointer"
        style={{ background: "transparent", border: `1px solid ${LINE}` }}
      >
        <p className="m-0 text-xs" style={{ color: MUTED }}>
          {summary} · {showAdvice ? "masquer le conseil" : "voir le conseil"}
        </p>
      </button>

      {showAdvice && (
        <div
          className="p-3 mb-3 text-xs"
          style={{ background: "#fff", border: `1px solid ${LINE}`, color: MUTED }}
        >
          <p className="m-0 mb-2">
            <span style={{ color: INK, fontWeight: 500 }}>Phase {phase.label.toLowerCase()}.</span>{" "}
            {phase.focus} Au moins {phase.minSlots} séances par semaine.
            {easyWeek ? " Cette semaine est allégée." : ""}
          </p>
          <p className="m-0 mb-2">{PROGRESSION[weekInBlock]}</p>

          {!enough && sessions.length > 0 && (
            <p className="m-0 mb-2" style={{ color: WARN_TX }}>
              {sessions.length} séance{sessions.length > 1 ? "s" : ""} programmée
              {sessions.length > 1 ? "s" : ""}, la phase en demande au moins {phase.minSlots}.
            </p>
          )}

          {late.length > 0 && (
            <p className="m-0 mb-2">
              À rattraper : {late.map((d) => DISC[d].label.toLowerCase()).join(", ")}. Sur tes{" "}
              {lateWeeks > 1 ? `${lateWeeks} dernières semaines` : "dernière semaine"}, leur part du
              volume est nettement sous ce que prévoit la phase.
            </p>
          )}

          {planned > 0 && (
            <div className="mb-2">
              <p className="m-0 mb-1">Répartition programmée, comparée à la phase :</p>
              {ORDER.map((d) => (
                <div key={d} className="flex justify-between">
                  <span style={{ color: DISC[d].c }}>{DISC[d].label}</span>
                  <span>
                    {Math.round(((byDisc[d] ?? 0) / planned) * 100)} % prévu ·{" "}
                    {Math.round((targets[d] / targetTotal) * 100)} % dans la phase
                  </span>
                </div>
              ))}
            </div>
          )}

          {mix.total > 0 && (
            <div>
              <p className="m-0 mb-1">
                Intensité : {mix.part.basse} % facile · {mix.part.seuil} % seuil · {mix.part.haute} %
                intense. La cible est autour de 80 / 5 / 15.
              </p>
              <div className="flex" style={{ height: 6 }}>
                {(["basse", "seuil", "haute"] as const).map((z) => (
                  <div
                    key={z}
                    style={{
                      width: `${mix.part[z]}%`,
                      background: z === "basse" ? "#C6D6E2" : z === "seuil" ? "#E0C99A" : "#B0451C",
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {empty && (
        <div className="p-3 mb-3 text-sm" style={{ background: WARN_BG, color: WARN_TX }}>
          Rien de prévu. Touche + sur un jour pour choisir une séance : celles conseillées pour ta
          phase apparaissent en premier.
        </div>
      )}

      {DAYS.map((day) => {
        const daySessions = sessions.filter((s) => s.day === day);
        const dayExtras = extras.filter((x) => x.day === day);
        const today = isToday(week, day);
        const open = openDay === day;

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
                onClick={() => add(day)}
                aria-label={open ? `Fermer ${day}` : `Ajouter ${day}`}
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
                {open ? "×" : "+"}
              </button>
            </div>

            {open && (
              <div className="flex gap-2 px-2 pb-2">
                <button
                  onClick={() => {
                    setOpenDay(null);
                    onProgram(day);
                  }}
                  className="flex-1 text-sm cursor-pointer border-none"
                  style={{ height: 44, background: INK, color: "#fff" }}
                >
                  Programmer
                </button>
                <button
                  onClick={() => {
                    setOpenDay(null);
                    onAddExtra(day);
                  }}
                  className="flex-1 text-sm cursor-pointer"
                  style={{ height: 44, border: `1px solid ${INK}`, background: "#fff", color: INK }}
                >
                  Noter une séance faite
                </button>
              </div>
            )}

            {(daySessions.length > 0 || dayExtras.length > 0) && (
              <div className="px-2 pb-2">
                {daySessions.map((s) => {
                  const st = journal[journalKey(week, s.id)]?.state;
                  const first = BLOCKS[s.blocks[0].id];
                  return (
                    <button
                      key={s.id}
                      onClick={() => onOpenSession(s.id)}
                      className="w-full text-left mb-1 p-3 cursor-pointer"
                      style={{
                        background: "#fff",
                        border: "none",
                        borderLeft: `3px solid ${DISC[first.disc].c}`,
                        opacity: st === "fait" ? 0.6 : 1,
                      }}
                    >
                      <div className="flex justify-between items-baseline gap-2">
                        <p className="m-0 text-sm" style={{ color: DISC[first.disc].c }}>
                          {s.blocks.map((b) => BLOCKS[b.id].label).join(" + ")}
                        </p>
                        <p className="m-0 text-xs whitespace-nowrap" style={{ color: MUTED }}>
                          {st ? `${STATES.find((x) => x[0] === st)![1].toLowerCase()} · ` : ""}
                          {minutesOf(s)} min
                        </p>
                      </div>
                      <p className="m-0 mt-1 text-xs" style={{ color: MUTED }}>
                        {placeLabel(first.place)}
                      </p>
                    </button>
                  );
                })}

                {dayExtras.map((x) => (
                  <button
                    key={x.id}
                    onClick={() => onOpenExtra(x.id)}
                    className="w-full text-left mb-1 p-3 cursor-pointer"
                    style={{
                      background: "#fff",
                      border: "none",
                      borderLeft: `3px solid ${ACTIVITY[x.activity].c}`,
                    }}
                  >
                    <div className="flex justify-between items-baseline gap-2">
                      <p className="m-0 text-sm" style={{ color: ACTIVITY[x.activity].c }}>
                        {x.activity === "autre"
                          ? (x.label ?? ACTIVITY.autre.label)
                          : `${ACTIVITY[x.activity].label}${x.label ? ` · ${x.label}` : ""}`}
                      </p>
                      <p className="m-0 text-xs whitespace-nowrap" style={{ color: MUTED }}>
                        extra · fait
                      </p>
                    </div>
                    <p className="m-0 mt-1 text-xs" style={{ color: MUTED }}>
                      {[
                        `${x.dur} min`,
                        x.km !== undefined ? formatDistance(x.activity, x.km) : null,
                        x.rpe !== undefined ? `effort ${x.rpe}/10` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

import { useMemo, useState } from "react";
import { BottomNav } from "./components/BottomNav";
import type { Tab } from "./components/BottomNav";
import { PHASES } from "./data/phases";
import { GOALS } from "./data/settings";
import { targetsFor, timing } from "./engine/phase";
import { doneByDiscipline, lagging, sessionsOf } from "./engine/week";
import { cssPace, isValidTest } from "./lib/swim";
import { dateOf, mondayKey, shiftWeek, weekOf, weeksBetween } from "./lib/date";
import { ExtraForm } from "./screens/ExtraForm";
import { History } from "./screens/History";
import { Periods } from "./screens/Periods";
import { Pick } from "./screens/Pick";
import { Session } from "./screens/Session";
import { Settings } from "./screens/Settings";
import { Week } from "./screens/Week";
import { journalKey } from "./store/db";
import { useExtras } from "./store/useExtras";
import { useJournal } from "./store/useJournal";
import { useSettings } from "./store/useSettings";
import { useWeights } from "./store/useWeights";
import { useWeek } from "./store/useWeek";
import { useWriteAlert } from "./store/useWriteAlert";
import { useSync } from "./sync/useSync";
import { INK, LINE, MUTED, PAPER, WARN_BG, WARN_TX } from "./theme";

/** Jusqu'où on peut remonter dans le passé. Au-delà, l'historique fait le travail. */
const PAST_WEEKS = 8;

/** Ce qui s'affiche par-dessus la semaine. */
type View =
  | { kind: "session"; id: string }
  | { kind: "pick"; day: string }
  | { kind: "extra"; day: string; id?: string }
  | null;

export default function App() {
  const [tab, setTab] = useState<Tab>("semaine");
  const [view, setView] = useState<View>(null);

  const { settings, loaded, update } = useSettings();
  const { journal, mark } = useJournal();
  const { extras, save: saveExtra, remove: removeExtra } = useExtras();
  const { weights, record } = useWeights();
  const sync = useSync();
  const writeAlert = useWriteAlert();
  const { goal, mode, zones, raceDate, access, swimTest } = settings;

  const currentWeek = useMemo(() => mondayKey(), []);
  const [week, setWeek] = useState(currentWeek);
  const weekStore = useWeek(week);

  const factor = GOALS.find((g) => g.id === goal)!.factor;

  // Le compte à rebours reste relatif à aujourd'hui, la phase à la semaine consultée :
  // préparer la semaine prochaine avec la phase d'aujourd'hui donnerait un conseil faux.
  const daysToRace = useMemo(() => timing(raceDate).days, [raceDate]);
  const { phase, easyWeek, weekInBlock } = useMemo(
    () => timing(raceDate, dateOf(week, "Lundi").getTime()),
    [raceDate, week],
  );

  // Allure de seuil en natation, si le test a été fait.
  const css = useMemo(
    () =>
      swimTest && isValidTest(swimTest.t400, swimTest.t200)
        ? cssPace(swimTest.t400, swimTest.t200)
        : undefined,
    [swimTest],
  );

  const sessions = useMemo(
    () => sessionsOf(weekStore.stored, journal, week),
    [weekStore.stored, journal, week],
  );
  const weekExtras = useMemo(() => extras.filter((x) => x.week === week), [extras, week]);

  const targets = useMemo(() => targetsFor(phase, factor, mode), [phase, factor, mode]);
  const done = useMemo(() => doneByDiscipline(journal, extras, week), [journal, extras, week]);
  const late = useMemo(() => lagging(done, targets), [done, targets]);

  const ready = loaded && weekStore.loaded;

  const lastWeek = useMemo(() => weekOf(raceDate), [raceDate]);
  const firstWeek = useMemo(() => shiftWeek(currentWeek, -PAST_WEEKS), [currentWeek]);
  const goWeek = (delta: number) => {
    const next = shiftWeek(week, delta);
    if (next < firstWeek || next > lastWeek) return;
    setView(null);
    setWeek(next);
  };

  // Une vue dont l'objet a disparu (séance retirée ailleurs) retombe sur la semaine.
  const opened = view?.kind === "session" ? sessions.find((s) => s.id === view.id) : undefined;
  const editedExtra =
    view?.kind === "extra" && view.id ? extras.find((x) => x.id === view.id) : undefined;
  const overlay =
    Boolean(opened) || view?.kind === "pick" || (view?.kind === "extra" && (!view.id || editedExtra));

  const goalLabel = GOALS.find((g) => g.id === goal)!.label;
  const back = () => setView(null);

  return (
    <div
      style={{
        background: PAPER,
        color: INK,
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        minHeight: "100%",
      }}
    >
      <div className="mx-auto p-4" style={{ maxWidth: 520 }}>
        {/* Une écriture qui échoue en silence ressemble à une app figée : on le dit. */}
        {writeAlert && (
          <div className="p-3 mb-3 text-sm" style={{ background: WARN_BG, color: WARN_TX }}>
            {writeAlert} Rien n'a été enregistré. Ferme complètement l'app et rouvre-la, puis
            réessaie.
          </div>
        )}

        {!ready && (
          <p className="text-sm" style={{ color: MUTED }}>
            Chargement…
          </p>
        )}

        {ready && !overlay && (
          <div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="m-0 text-base font-medium">{goalLabel}</p>
                <p className="m-0 mt-1 text-xs" style={{ color: MUTED }}>
                  Phase {phase.label.toLowerCase()} · semaine {weekInBlock} sur 4
                  {easyWeek ? " · allégée" : ""}
                </p>
              </div>
              <div className="text-right">
                <p
                  className="m-0 leading-none"
                  style={{ fontSize: 34, fontWeight: 500, letterSpacing: "-0.02em" }}
                >
                  {daysToRace}
                </p>
                <p className="m-0 text-xs" style={{ color: MUTED }}>
                  jours
                </p>
              </div>
            </div>
            <div className="flex gap-1 mb-5">
              {PHASES.map((p) => (
                <div
                  key={p.id}
                  style={{ flexGrow: p.span, height: 4, background: p.id === phase.id ? INK : LINE }}
                />
              ))}
            </div>
          </div>
        )}

        {ready && opened && (
          <Session
            session={opened}
            week={week}
            phase={phase}
            weekInBlock={weekInBlock}
            zones={zones}
            css={css}
            mode={mode}
            state={journal[journalKey(week, opened.id)]?.state}
            onMark={(st) => mark(week, opened, st)}
            onMove={(day) => weekStore.move(opened.id, day)}
            onResize={(dur) => weekStore.resize(opened.id, dur)}
            onRemove={() => {
              weekStore.remove(opened.id);
              back();
            }}
            onBack={back}
          />
        )}

        {ready && view?.kind === "pick" && (
          <Pick
            week={week}
            day={view.day}
            access={access}
            phase={phase}
            mode={mode}
            late={late}
            already={sessions.flatMap((s) => s.blocks.map((b) => b.id))}
            onAdd={(block, dur) => {
              weekStore.add(view.day, block, dur);
              back();
            }}
            onBack={back}
          />
        )}

        {ready && view?.kind === "extra" && (!view.id || editedExtra) && (
          <ExtraForm
            // Une clé par séance : passer d'une séance extra à l'autre repart d'un formulaire neuf.
            key={view.id ?? `new-${view.day}`}
            week={week}
            day={editedExtra?.day ?? view.day}
            initial={editedExtra}
            onSave={(x) => {
              saveExtra(x);
              back();
            }}
            onRemove={(id) => {
              removeExtra(id);
              back();
            }}
            onBack={back}
          />
        )}

        {ready && !overlay && tab === "semaine" && (
          <Week
            week={week}
            offset={weeksBetween(currentWeek, week)}
            canGoBack={shiftWeek(week, -1) >= firstWeek}
            canGoForward={shiftWeek(week, 1) <= lastWeek}
            sessions={sessions}
            extras={weekExtras}
            journal={journal}
            phase={phase}
            weekInBlock={weekInBlock}
            easyWeek={easyWeek}
            late={late}
            lateWeeks={done.weeks}
            targets={targets}
            onGoWeek={goWeek}
            onBackToCurrent={() => setWeek(currentWeek)}
            onOpenSession={(id) => setView({ kind: "session", id })}
            onProgram={(day) => setView({ kind: "pick", day })}
            onAddExtra={(day) => setView({ kind: "extra", day })}
            onOpenExtra={(id) => {
              const x = extras.find((e) => e.id === id);
              if (x) setView({ kind: "extra", day: x.day, id });
            }}
          />
        )}

        {ready && !overlay && tab === "historique" && (
          <History
            journal={journal}
            extras={extras}
            week={currentWeek}
            weights={weights}
            onRecordWeight={record}
          />
        )}

        {ready && !overlay && tab === "reglages" && (
          <Settings
            settings={settings}
            today={currentWeek}
            sync={sync}
            onChange={update}
            onShowPeriods={() => setTab("periodes")}
            onShowWeek={() => setTab("semaine")}
          />
        )}

        {ready && !overlay && tab === "periodes" && (
          <Periods
            phase={phase}
            mode={mode}
            factor={factor}
            access={access}
            onBack={() => setTab("reglages")}
          />
        )}

        {ready && !overlay && <BottomNav tab={tab} onChange={setTab} />}
      </div>
    </div>
  );
}

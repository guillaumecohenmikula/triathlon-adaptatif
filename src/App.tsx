import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "./components/BottomNav";
import type { Tab } from "./components/BottomNav";
import { PHASES } from "./data/phases";
import { DAYS, GOALS, PLACES } from "./data/settings";
import type { PlaceId, Slot } from "./data/types";
import { deficits } from "./engine/deficits";
import { targetsFor, timing } from "./engine/phase";
import { resolveWeek, settingsStamp } from "./engine/replan";
import { mondayKey, todayIndex as dayIndexNow } from "./lib/date";
import { History } from "./screens/History";
import { Periods } from "./screens/Periods";
import { Session } from "./screens/Session";
import { Settings } from "./screens/Settings";
import { Week } from "./screens/Week";
import { useJournal } from "./store/useJournal";
import { useSettings } from "./store/useSettings";
import { useWeek } from "./store/useWeek";
import { INK, LINE, MUTED, PAPER } from "./theme";

export default function App() {
  const [tab, setTab] = useState<Tab>("semaine");
  const [openDay, setOpenDay] = useState<string | null>(null);

  const { settings, loaded, update } = useSettings();
  const { journal, mark } = useJournal();
  const { goal, mode, zones, raceDate, access, slots } = settings;

  const week = mondayKey();
  const weekStore = useWeek(week);
  const factor = GOALS.find((g) => g.id === goal)!.factor;

  // Lundi = 0, pour savoir ce qui appartient déjà au passé.
  const todayIndex = useMemo(() => dayIndexNow(), []);

  const { days, phase, easyWeek, weekInBlock } = useMemo(() => timing(raceDate), [raceDate]);
  const targets = useMemo(() => targetsFor(phase, factor, mode), [phase, factor, mode]);
  const def = useMemo(() => deficits(journal, targets, week), [journal, targets, week]);

  const openPlaces = PLACES.filter((p) => access[p.needs]);

  // Un créneau dont le lieu n'est plus accessible disparaît du plan sans être supprimé.
  const orderedSlots: Slot[] = useMemo(
    () =>
      DAYS.filter((d) => slots[d] && access[PLACES.find((p) => p.id === slots[d].place)!.needs]).map(
        (d) => ({ day: d, place: slots[d].place, duration: slots[d].duration }),
      ),
    [slots, access],
  );

  const stamp = useMemo(
    () => settingsStamp({ goal, mode, raceDate, access }),
    [goal, mode, raceDate, access],
  );
  const stored = weekStore.stored;
  const cancelled = useMemo(() => stored?.cancelled ?? [], [stored]);

  const resolved = useMemo(
    () =>
      resolveWeek({
        stored,
        slots: orderedSlots,
        cancelled,
        journal,
        week,
        todayIndex,
        stamp,
        phase,
        easyWeek,
        def,
        access,
        mode,
      }),
    [stored, orderedSlots, cancelled, journal, week, todayIndex, stamp, phase, easyWeek, def, access, mode],
  );

  const ready = loaded && weekStore.loaded;

  // La semaine résolue est figée en base : c'est elle qui rend la replanification possible.
  useEffect(() => {
    if (!ready || !resolved.changed) return;
    weekStore.save(resolved.sessions, cancelled, resolved.orphans, stamp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, resolved, cancelled, stamp]);

  const toggleDay = (d: string) => {
    const next = { ...slots };
    if (next[d]) delete next[d];
    else next[d] = { place: openPlaces[0]?.id ?? "maison", duration: 60 };
    update({ slots: next });
  };

  const setSlot = (d: string, patch: Partial<{ place: PlaceId; duration: number }>) =>
    update({ slots: { ...slots, [d]: { ...slots[d], ...patch } } });

  const opened = resolved.sessions.find((s) => s.day === openDay);
  const goalLabel = GOALS.find((g) => g.id === goal)!.label;

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
        {!ready && (
          <p className="text-sm" style={{ color: MUTED }}>
            Chargement…
          </p>
        )}

        {ready && !opened && (
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
                  {days}
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
            state={journal[`${week}|${opened.day}`]?.state}
            onMark={(st) => mark(week, opened.day, opened.place, opened.blocks, st)}
            onCancel={() => {
              weekStore.cancelDay(opened.day);
              setOpenDay(null);
            }}
            onBack={() => setOpenDay(null)}
          />
        )}

        {ready && !opened && tab === "semaine" && (
          <Week
            week={week}
            placed={resolved.sessions}
            dropped={resolved.dropped}
            orphans={resolved.orphans}
            cancelled={cancelled}
            slots={slots}
            openPlaces={openPlaces}
            journal={journal}
            phase={phase}
            weekInBlock={weekInBlock}
            def={def}
            slotCount={orderedSlots.length}
            onOpen={setOpenDay}
            onRestore={weekStore.restoreDay}
            onToggleDay={toggleDay}
            onSlotChange={setSlot}
          />
        )}

        {ready && !opened && tab === "historique" && <History journal={journal} week={week} />}

        {ready && !opened && tab === "reglages" && (
          <Settings
            settings={settings}
            onChange={update}
            onShowPeriods={() => setTab("periodes")}
            onShowWeek={() => setTab("semaine")}
          />
        )}

        {ready && !opened && tab === "periodes" && (
          <Periods
            phase={phase}
            mode={mode}
            factor={factor}
            access={access}
            onBack={() => setTab("reglages")}
          />
        )}

        {ready && !opened && <BottomNav tab={tab} onChange={setTab} />}
      </div>
    </div>
  );
}

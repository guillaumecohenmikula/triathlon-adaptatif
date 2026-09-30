import { useMemo, useState } from "react";
import { BottomNav } from "./components/BottomNav";
import type { Tab } from "./components/BottomNav";
import { GOALS } from "./data/settings";
import { SESSION_GUIDES } from "./data/sessionGuides";
import type { Session, Template } from "./data/types";
import { signals } from "./engine/advice";
import { blankSession, fromTemplate, newId } from "./engine/session";
import { cssPace, isValidTest } from "./lib/swim";
import { daysUntil, mondayKey, shiftWeek, weekOf, weeksBetween } from "./lib/date";
import { Choose } from "./screens/Choose";
import { Library } from "./screens/Library";
import { Measures } from "./screens/Measures";
import { SessionView } from "./screens/SessionView";
import { Settings } from "./screens/Settings";
import { TemplateEdit } from "./screens/TemplateEdit";
import { Week } from "./screens/Week";
import { useLibrary } from "./store/useLibrary";
import { useSessions } from "./store/useSessions";
import { useSettings } from "./store/useSettings";
import { useWeights } from "./store/useWeights";
import { useWriteAlert } from "./store/useWriteAlert";
import { useSync } from "./sync/useSync";
import { INK, MUTED, PAPER, WARN_BG, WARN_TX } from "./theme";

/** Jusqu'où on peut remonter dans le passé depuis l'écran de semaine. */
const PAST_WEEKS = 12;

/** Ce qui s'affiche par-dessus l'onglet courant. */
type View =
  | { kind: "session"; id: string }
  | { kind: "choose"; day: string }
  | { kind: "template"; template: Template }
  | null;

export default function App() {
  const [tab, setTab] = useState<Tab>("semaine");
  const [view, setView] = useState<View>(null);

  const { settings, loaded, update } = useSettings();
  const store = useSessions();
  const library = useLibrary();
  const { weights, record } = useWeights();
  const sync = useSync();
  const writeAlert = useWriteAlert();

  const currentWeek = useMemo(() => mondayKey(), []);
  const [week, setWeek] = useState(currentWeek);

  const days = useMemo(() => daysUntil(settings.raceDate), [settings.raceDate]);
  const goal = GOALS.find((g) => g.id === settings.goal)!;

  // Allure de seuil en natation, si le test a été fait.
  const css = useMemo(
    () =>
      settings.swimTest && isValidTest(settings.swimTest.t400, settings.swimTest.t200)
        ? cssPace(settings.swimTest.t400, settings.swimTest.t200)
        : undefined,
    [settings.swimTest],
  );

  const weekSessions = useMemo(
    () => store.sessions.filter((s) => s.week === week),
    [store.sessions, week],
  );
  const advice = useMemo(() => signals(store.sessions, currentWeek), [store.sessions, currentWeek]);

  const ready = loaded && store.loaded && library.loaded;
  const opened = view?.kind === "session" ? store.sessions.find((s) => s.id === view.id) : undefined;
  const overlay = Boolean(opened) || view?.kind === "choose" || view?.kind === "template";

  // La fiche de séance vient du modèle d'origine, quand la séance en vient d'un.
  const guide = useMemo(() => {
    const from = opened?.from ? library.templates.find((t) => t.id === opened.from) : undefined;
    return from?.guide ? SESSION_GUIDES[from.guide as keyof typeof SESSION_GUIDES] : undefined;
  }, [opened, library.templates]);

  const lastWeek = useMemo(() => weekOf(settings.raceDate), [settings.raceDate]);
  const firstWeek = useMemo(() => shiftWeek(currentWeek, -PAST_WEEKS), [currentWeek]);
  const goWeek = (delta: number) => {
    const next = shiftWeek(week, delta);
    if (next < firstWeek || next > lastWeek) return;
    setView(null);
    setWeek(next);
  };

  const back = () => setView(null);

  /** Pose une séance sur un jour et l'ouvre : on enchaîne presque toujours sur son contenu. */
  const place = (session: Session) => {
    store.add(session);
    setView({ kind: "session", id: session.id });
  };

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
          <div className="flex justify-between items-start mb-5">
            <div>
              <p className="m-0 text-base font-medium">{goal.label}</p>
              <p className="m-0 mt-1 text-xs" style={{ color: MUTED }}>
                {goal.detail}
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
        )}

        {ready && opened && (
          <SessionView
            key={opened.id}
            session={opened}
            sessions={store.sessions}
            movements={library.movements}
            guide={guide}
            css={css}
            onPatch={(change) => store.patch(opened.id, change)}
            onItems={(items) => store.setItems(opened.id, items)}
            onDone={(itemId, done) => store.setDone(opened.id, itemId, done)}
            onMark={(state) => store.mark(opened.id, state)}
            onActual={(actual) => store.setActual(opened.id, actual)}
            onSaveTemplate={library.saveTemplate}
            onRemove={() => {
              store.remove(opened.id);
              back();
            }}
            onBack={back}
          />
        )}

        {ready && view?.kind === "choose" && (
          <Choose
            week={week}
            day={view.day}
            templates={library.templates}
            onPick={(t) => place(fromTemplate(t, week, view.day))}
            onBlank={() => place(blankSession(week, view.day))}
            onBack={back}
          />
        )}

        {ready && view?.kind === "template" && (
          <TemplateEdit
            template={view.template}
            movements={library.movements}
            onSave={(t) => {
              library.saveTemplate(t);
              back();
            }}
            onDelete={
              view.template.builtIn
                ? undefined
                : () => {
                    library.deleteTemplate(view.template.id);
                    back();
                  }
            }
            onBack={back}
          />
        )}

        {ready && !overlay && tab === "semaine" && (
          <Week
            week={week}
            offset={weeksBetween(currentWeek, week)}
            canGoBack={shiftWeek(week, -1) >= firstWeek}
            canGoForward={shiftWeek(week, 1) <= lastWeek}
            sessions={weekSessions}
            signal={advice[0]}
            onGoWeek={goWeek}
            onBackToCurrent={() => setWeek(currentWeek)}
            onOpen={(id) => setView({ kind: "session", id })}
            onAdd={(day) => setView({ kind: "choose", day })}
          />
        )}

        {ready && !overlay && tab === "bibliotheque" && (
          <Library
            templates={library.templates}
            archived={library.archived}
            onCreate={() =>
              setView({
                kind: "template",
                template: { id: newId(), name: "", disc: "course", items: [] },
              })
            }
            onEdit={(id) => {
              const template = [...library.templates, ...library.archived].find((t) => t.id === id);
              if (template) setView({ kind: "template", template });
            }}
            onDuplicate={(t) =>
              setView({
                kind: "template",
                template: { ...t, id: newId(), name: `${t.name} (copie)`, builtIn: undefined },
              })
            }
            onArchive={library.archiveTemplate}
          />
        )}

        {ready && !overlay && tab === "mesures" && (
          <Measures
            sessions={store.sessions}
            signals={advice}
            currentWeek={currentWeek}
            weights={weights}
            onRecordWeight={record}
          />
        )}

        {ready && !overlay && tab === "reglages" && (
          <Settings settings={settings} today={currentWeek} sync={sync} onChange={update} />
        )}

        {ready && !overlay && <BottomNav tab={tab} onChange={setTab} />}
      </div>
    </div>
  );
}

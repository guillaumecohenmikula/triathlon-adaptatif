import { Diagnostic } from "../components/Diagnostic";
import { SwimTest } from "../components/SwimTest";
import { SyncPanel } from "../components/SyncPanel";
import { GOALS } from "../data/settings";
import type { GoalId } from "../data/types";
import type { Settings as SettingsValues } from "../store/db";
import type { SyncStore } from "../sync/useSync";
import { INK, LINE, MUTED } from "../theme";

interface Props {
  settings: SettingsValues;
  /** Lundi ISO de la semaine en cours, pour dater le test de natation. */
  today: string;
  sync: SyncStore;
  onChange: (patch: Partial<SettingsValues>) => void;
}

export function Settings({ settings, today, sync, onChange }: Props) {
  const { goal, raceDate } = settings;

  return (
    <div>
      <p className="m-0 mb-2 text-sm font-medium">Mon objectif</p>
      <div className="grid grid-cols-1 gap-2 mb-5">
        {GOALS.map((g) => {
          const on = goal === g.id;
          return (
            <button
              key={g.id}
              onClick={() => onChange({ goal: g.id as GoalId })}
              className="text-left p-3 cursor-pointer"
              style={{ background: "#fff", border: `1px solid ${on ? INK : LINE}` }}
            >
              <p className="m-0 text-sm" style={{ fontWeight: on ? 500 : 400 }}>
                {g.label}
              </p>
              <p className="m-0 text-xs" style={{ color: MUTED }}>
                {g.detail}
              </p>
            </button>
          );
        })}
      </div>

      <p className="m-0 mb-2 text-sm font-medium">Date de l'épreuve</p>
      <input
        type="date"
        value={raceDate}
        onChange={(e) => onChange({ raceDate: e.target.value })}
        className="w-full p-2 mb-5 text-sm"
        style={{ border: `1px solid ${LINE}`, background: "#fff", color: INK }}
      />

      <div className="mb-5">
        <SwimTest
          test={settings.swimTest}
          today={today}
          onSave={(swimTest) => onChange({ swimTest })}
          onClear={() => onChange({ swimTest: undefined })}
        />
      </div>

      <div className="mb-5">
        <SyncPanel sync={sync} />
      </div>

      <div className="pt-4" style={{ borderTop: `1px solid ${LINE}` }}>
        <Diagnostic />
      </div>
    </div>
  );
}

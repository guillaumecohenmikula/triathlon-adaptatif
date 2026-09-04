import { ACCESS, GOALS, MODES, ZONES } from "../data/settings";
import type { AccessId, GoalId, ModeId, ZoneId } from "../data/types";
import type { Settings as SettingsValues } from "../store/db";
import { INK, LINE, MUTED, WARN_BG, WARN_TX } from "../theme";

interface Props {
  settings: SettingsValues;
  onChange: (patch: Partial<SettingsValues>) => void;
  onShowPeriods: () => void;
  onShowWeek: () => void;
}

export function Settings({ settings, onChange, onShowPeriods, onShowWeek }: Props) {
  const { goal, mode, zones, raceDate, access } = settings;

  const card = (selected: boolean) => ({
    background: "#fff",
    border: `1px solid ${selected ? INK : LINE}`,
  });

  return (
    <div>
      <p className="m-0 mb-2 text-sm font-medium">Mon objectif</p>
      <div className="grid grid-cols-1 gap-2 mb-5">
        {GOALS.map((g) => (
          <button
            key={g.id}
            onClick={() => onChange({ goal: g.id as GoalId })}
            className="text-left p-3 cursor-pointer"
            style={card(goal === g.id)}
          >
            <p className="m-0 text-sm" style={{ fontWeight: goal === g.id ? 500 : 400 }}>
              {g.label}
            </p>
            <p className="m-0 text-xs" style={{ color: MUTED }}>
              {g.detail}
            </p>
          </button>
        ))}
      </div>

      <p className="m-0 mb-2 text-sm font-medium">Ce que je veux en plus du chrono</p>
      <div className="grid grid-cols-1 gap-2 mb-5">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => onChange({ mode: m.id as ModeId })}
            className="text-left p-3 cursor-pointer"
            style={card(mode === m.id)}
          >
            <p className="m-0 text-sm" style={{ fontWeight: mode === m.id ? 500 : 400 }}>
              {m.label}
            </p>
            <p className="m-0 text-xs" style={{ color: MUTED }}>
              {m.detail}
            </p>
          </button>
        ))}
      </div>

      <p className="m-0 mb-1 text-sm font-medium">Zones que je veux développer</p>
      <p className="m-0 mb-2 text-xs" style={{ color: MUTED }}>
        Les exercices qui les travaillent passent en premier et gagnent une série.
      </p>
      <div className="flex flex-wrap gap-2 mb-5">
        {ZONES.map((z) => {
          const on = Boolean(zones[z.id as ZoneId]);
          return (
            <button
              key={z.id}
              onClick={() => onChange({ zones: { ...zones, [z.id]: !on } })}
              className="text-sm px-3 py-2 cursor-pointer"
              style={{
                background: on ? INK : "#fff",
                color: on ? "#fff" : MUTED,
                border: `1px solid ${on ? INK : LINE}`,
              }}
            >
              {z.label}
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

      <p className="m-0 mb-1 text-sm font-medium">Ce à quoi j'ai accès</p>
      <p className="m-0 mb-2 text-xs" style={{ color: MUTED }}>
        Seules les séances réalisables avec ça te seront proposées.
      </p>
      <div className="grid grid-cols-1 gap-2 mb-5">
        {ACCESS.map((a) => {
          const on = access[a.id as AccessId];
          return (
            <button
              key={a.id}
              onClick={() => onChange({ access: { ...access, [a.id]: !on } })}
              className="text-left p-3 cursor-pointer"
              style={{ background: "#fff", border: `1px solid ${on ? INK : LINE}` }}
            >
              <p
                className="m-0 text-sm"
                style={{ fontWeight: on ? 500 : 400, color: on ? INK : MUTED }}
              >
                {on ? "✓ " : "  "}
                {a.label}
              </p>
              <p className="m-0 text-xs" style={{ color: MUTED }}>
                {a.hint}
              </p>
            </button>
          );
        })}
      </div>

      {!access.veloRoute && (
        <div className="p-3 mb-3 text-sm" style={{ background: WARN_BG, color: WARN_TX }}>
          Pas de vélo de route : les enchaînements vélo-course de la phase spécifique resteront
          impossibles.
        </div>
      )}

      <button
        onClick={onShowPeriods}
        className="w-full p-3 mb-2 text-sm cursor-pointer"
        style={{ background: "#fff", border: `1px solid ${LINE}`, color: INK }}
      >
        Voir le plan par période →
      </button>
      <button
        onClick={onShowWeek}
        className="w-full p-3 text-sm cursor-pointer border-none"
        style={{ background: INK, color: "#fff" }}
      >
        Voir ma semaine
      </button>
    </div>
  );
}

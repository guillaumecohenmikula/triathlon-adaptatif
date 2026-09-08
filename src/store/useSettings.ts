import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { DEFAULTS, db, stamp } from "./db";
import type { Settings } from "./db";
import { track } from "./writes";

export interface SettingsStore {
  settings: Settings;
  /** false tant que la base n'a pas répondu : évite d'afficher les valeurs par défaut. */
  loaded: boolean;
  update: (patch: Partial<Settings>) => void;
}

export function useSettings(): SettingsStore {
  // L'enveloppe distingue « requête en cours » (undefined) de « rien d'enregistré » ({ row: undefined }).
  const wrapped = useLiveQuery(async () => ({ row: await db.settings.get("app") }), []);

  const settings = useMemo(
    () => (wrapped?.row ? { ...DEFAULTS, ...wrapped.row } : DEFAULTS),
    [wrapped],
  );

  const update = (patch: Partial<Settings>) => {
    track("Enregistrement des réglages", () =>
      db.settings.put(stamp({ key: "app" as const, ...settings, ...patch })),
    );
  };

  return { settings, loaded: wrapped !== undefined, update };
}

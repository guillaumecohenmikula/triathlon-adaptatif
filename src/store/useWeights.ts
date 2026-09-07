import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { db, stamp } from "./db";
import type { WeightRow } from "./db";

export interface WeightStore {
  /** Pesées triées de la plus ancienne à la plus récente. */
  weights: WeightRow[];
  record: (week: string, kg: number) => void;
  remove: (week: string) => void;
}

export function useWeights(): WeightStore {
  const rows = useLiveQuery(() => db.weights.toArray(), [], []);
  const weights = useMemo(
    () => rows.filter((r) => !r.deleted).sort((a, b) => a.week.localeCompare(b.week)),
    [rows],
  );

  return {
    weights,
    record: (week, kg) => {
      void db.weights.put(stamp({ week, kg, deleted: false }));
    },
    remove: (week) => {
      void db.transaction("rw", db.weights, async () => {
        const row = await db.weights.get(week);
        if (row) await db.weights.put(stamp({ ...row, deleted: true }));
      });
    },
  };
}

import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { db } from "./db";
import type { WeightRow } from "./db";

export interface WeightStore {
  /** Pesées triées de la plus ancienne à la plus récente. */
  weights: WeightRow[];
  record: (week: string, kg: number) => void;
  remove: (week: string) => void;
}

export function useWeights(): WeightStore {
  const rows = useLiveQuery(() => db.weights.toArray(), [], []);
  const weights = useMemo(() => [...rows].sort((a, b) => a.week.localeCompare(b.week)), [rows]);

  return {
    weights,
    record: (week, kg) => {
      void db.weights.put({ week, kg });
    },
    remove: (week) => {
      void db.weights.delete(week);
    },
  };
}

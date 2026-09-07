/** Les quatre familles d'enregistrements que l'app synchronise. */
export type SyncKind = "settings" | "journal" | "week" | "weight";

export interface SyncRecord {
  kind: SyncKind;
  /** Identifiant local : « app », « 2026-09-07|Mardi », « 2026-09-07 »… */
  key: string;
  payload: Record<string, unknown>;
  deleted: boolean;
  /** Horloge locale pour ce qui monte, horloge serveur pour ce qui descend. */
  updatedAt: number;
}

/** Une ligne locale, quelle que soit sa table. */
export interface LocalRow {
  updatedAt?: number;
  deleted?: boolean;
  [k: string]: unknown;
}

/**
 * Ce qu'il faut pousser : tout ce qui a bougé depuis le dernier envoi.
 * Les enregistrements sans horodatage sont poussés aussi, ils viennent d'une version
 * antérieure à la synchronisation.
 */
export function toPush(
  kind: SyncKind,
  rows: LocalRow[],
  keyOf: (row: LocalRow) => string,
  since: number,
): SyncRecord[] {
  return rows
    // Un enregistrement sans horodatage vient d'avant la synchronisation : il monte.
    .filter((r) => r.updatedAt === undefined || r.updatedAt > since)
    .map((r) => {
      const { updatedAt, deleted, ...payload } = r;
      return {
        kind,
        key: keyOf(r),
        payload: payload as Record<string, unknown>,
        deleted: Boolean(deleted),
        updatedAt: updatedAt ?? 0,
      };
    });
}

/**
 * Faut-il écrire l'enregistrement distant par-dessus le local ?
 *
 * Le push précède toujours le pull, donc ce qui redescend a déjà été arbitré par le
 * serveur. On n'écrase que si le contenu diffère réellement, pour ne pas réveiller
 * inutilement les vues qui écoutent la base.
 */
export function shouldApply(remote: SyncRecord, local: LocalRow | undefined): boolean {
  if (!local) return !remote.deleted;
  if (Boolean(local.deleted) !== remote.deleted) return true;
  const { updatedAt: _u, deleted: _d, ...current } = local;
  return JSON.stringify(current) !== JSON.stringify(remote.payload);
}

/** Le repère du prochain pull : la date serveur la plus récente reçue. */
export function nextPullMark(records: SyncRecord[], previous: number): number {
  return records.reduce((max, r) => Math.max(max, r.updatedAt), previous);
}

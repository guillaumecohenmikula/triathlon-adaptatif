import { db } from "../store/db";
import type { LocalRow, SyncKind, SyncRecord } from "./records";
import { nextPullMark, shouldApply, toPush } from "./records";
import { supabase } from "./client";

const TABLE = "tri_sync";

/** Où chaque famille d'enregistrements vit en local, et comment on l'identifie. */
const SOURCES: { kind: SyncKind; table: "settings" | "journal" | "weeks" | "weights"; keyOf: (r: LocalRow) => string }[] = [
  { kind: "settings", table: "settings", keyOf: (r) => String(r.key) },
  { kind: "journal", table: "journal", keyOf: (r) => String(r.key) },
  { kind: "week", table: "weeks", keyOf: (r) => String(r.week) },
  { kind: "weight", table: "weights", keyOf: (r) => String(r.week) },
];

const byKind = Object.fromEntries(SOURCES.map((s) => [s.kind, s])) as Record<
  SyncKind,
  (typeof SOURCES)[number]
>;

const readMark = async (key: string) => Number((await db.meta.get(key))?.value ?? 0);
const writeMark = (key: string, value: number) => db.meta.put({ key, value });

export interface SyncOutcome {
  pushed: number;
  pulled: number;
  at: number;
}

/**
 * Un passage de synchronisation : on pousse d'abord ce qui a bougé ici, puis on
 * redescend l'état consolidé. Dans cet ordre, c'est toujours le serveur qui arbitre,
 * et « le plus récent gagne » enregistrement par enregistrement.
 */
export async function synchronise(): Promise<SyncOutcome> {
  if (!supabase) throw new Error("Synchronisation non configurée.");

  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) throw new Error("Connecte-toi pour synchroniser.");

  // --- montée ---
  const lastPushed = await readMark("lastPushedAt");
  const startedAt = Date.now();
  const outgoing: SyncRecord[] = [];

  for (const { kind, table, keyOf } of SOURCES) {
    const rows = (await db.table(table).toArray()) as LocalRow[];
    outgoing.push(...toPush(kind, rows, keyOf, lastPushed));
  }

  if (outgoing.length > 0) {
    const { error } = await supabase.from(TABLE).upsert(
      outgoing.map((r) => ({
        user_id: userId,
        kind: r.kind,
        key: r.key,
        payload: r.payload,
        deleted: r.deleted,
      })),
      { onConflict: "user_id,kind,key" },
    );
    if (error) throw new Error(`Envoi impossible : ${error.message}`);
  }
  await writeMark("lastPushedAt", startedAt);

  // --- descente ---
  const lastPulled = await readMark("lastPulledAt");
  const { data, error } = await supabase
    .from(TABLE)
    .select("kind, key, payload, deleted, updated_at")
    .gt("updated_at", new Date(lastPulled).toISOString())
    .order("updated_at", { ascending: true });
  if (error) throw new Error(`Réception impossible : ${error.message}`);

  const incoming: SyncRecord[] = (data ?? []).map((r) => ({
    kind: r.kind as SyncKind,
    key: r.key as string,
    payload: (r.payload ?? {}) as Record<string, unknown>,
    deleted: Boolean(r.deleted),
    updatedAt: new Date(r.updated_at as string).getTime(),
  }));

  let pulled = 0;
  for (const rec of incoming) {
    const source = byKind[rec.kind];
    if (!source) continue;
    const table = db.table(source.table);
    const local = (await table.get(rec.key)) as LocalRow | undefined;
    if (!shouldApply(rec, local)) continue;
    // Horodaté à l'instant du push, jamais à maintenant : sinon ce qu'on vient de
    // recevoir repartirait au passage suivant, et la boucle ne s'arrêterait jamais.
    await table.put({ ...rec.payload, deleted: rec.deleted, updatedAt: startedAt });
    pulled += 1;
  }

  await writeMark("lastPulledAt", nextPullMark(incoming, lastPulled));
  return { pushed: outgoing.length, pulled, at: Date.now() };
}

/** Repartir de zéro : tout sera repoussé et retiré au prochain passage. */
export async function resetSyncMarks() {
  await writeMark("lastPushedAt", 0);
  await writeMark("lastPulledAt", 0);
}

import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { db } from "../store/db";
import { INK, LINE, MUTED, WARN_BG, WARN_TX } from "../theme";

const PROBE = "probe";

/**
 * Deux pannes donnent le même symptôme, « je touche et rien ne bouge » :
 * l'écriture échoue, ou elle réussit sans que l'écran se rafraîchisse.
 * Ce test les sépare. Il écrit un compteur, le relit aussitôt en direct,
 * et affiche côte à côte la valeur relue et celle que l'écran reçoit.
 */
export function Diagnostic() {
  const shown = useLiveQuery(async () => Number((await db.meta.get(PROBE))?.value ?? 0), [], -1);
  const [readBack, setReadBack] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    void navigator.storage?.persisted?.().then(setPersisted, () => setPersisted(null));
  }, []);

  const test = async () => {
    setError(null);
    try {
      const before = Number((await db.meta.get(PROBE))?.value ?? 0);
      await db.meta.put({ key: PROBE, value: before + 1 });
      setReadBack(Number((await db.meta.get(PROBE))?.value ?? 0));
    } catch (e) {
      setReadBack(null);
      setError(e instanceof Error ? e.message : "écriture refusée");
    }
  };

  const stale = readBack !== null && shown !== readBack;

  return (
    <div>
      <p className="m-0 mb-1 text-sm font-medium">Diagnostic</p>
      <p className="m-0 mb-2 text-xs" style={{ color: MUTED }}>
        À utiliser si l'app ne réagit plus quand tu modifies quelque chose.
      </p>

      <button
        onClick={() => void test()}
        className="w-full p-3 mb-2 text-sm cursor-pointer"
        style={{ background: "#fff", border: `1px solid ${LINE}`, color: INK }}
      >
        Tester l'enregistrement
      </button>

      {error && (
        <div className="p-3 mb-2 text-xs" style={{ background: WARN_BG, color: WARN_TX }}>
          L'écriture a échoué : {error}. C'est la base de données locale qui refuse, pas l'affichage.
        </div>
      )}

      {readBack !== null && !error && (
        <div
          className="p-3 mb-2 text-xs"
          style={
            stale
              ? { background: WARN_BG, color: WARN_TX }
              : { background: "#fff", border: `1px solid ${LINE}`, color: MUTED }
          }
        >
          {stale
            ? `Écrit ${readBack}, mais l'écran en est resté à ${shown}. L'enregistrement fonctionne, c'est le rafraîchissement de l'affichage qui est bloqué. Ferme complètement l'app et rouvre-la.`
            : `Écrit et relu : ${readBack}. L'enregistrement et l'affichage fonctionnent tous les deux.`}
        </div>
      )}

      <p className="m-0 text-xs" style={{ color: MUTED }}>
        Stockage {persisted === null ? "d'état inconnu" : persisted ? "permanent" : "non garanti"} ·
        version du {__BUILD__}
      </p>
    </div>
  );
}

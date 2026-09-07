import { useState } from "react";
import type { SyncStore } from "../sync/useSync";
import { INK, LINE, MUTED, WARN_BG, WARN_TX } from "../theme";

const field = { border: `1px solid ${LINE}`, background: "#fff", color: INK };

const ago = (t: number) => {
  const min = Math.round((Date.now() - t) / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  return `il y a ${Math.round(min / 60)} h`;
};

/** Connexion et état de la synchronisation. L'app marche sans, c'est un supplément. */
export function SyncPanel({ sync }: { sync: SyncStore }) {
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");

  if (!sync.configured) {
    return (
      <div>
        <p className="m-0 mb-1 text-sm font-medium">Synchronisation</p>
        <p className="m-0 text-xs" style={{ color: MUTED }}>
          Pas encore configurée. Tes données restent sur cet appareil, et il n'en existe
          aucune copie ailleurs.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <p className="m-0 text-sm font-medium">Synchronisation</p>
        {sync.email && sync.lastSync && (
          <p className="m-0 text-xs" style={{ color: MUTED }}>
            {ago(sync.lastSync)}
          </p>
        )}
      </div>

      {!sync.email && (
        <>
          <p className="m-0 mb-2 text-xs" style={{ color: MUTED }}>
            Connecte-toi pour retrouver tes séances sur tes autres appareils. Sans connexion,
            l'app fonctionne exactement pareil, en local.
          </p>
          <div className="flex flex-col gap-2">
            <input
              type="email"
              value={mail}
              onChange={(e) => setMail(e.target.value)}
              placeholder="Adresse email"
              autoComplete="username"
              className="p-2 text-sm"
              style={field}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void sync.signIn(mail, password)}
              placeholder="Mot de passe"
              autoComplete="current-password"
              className="p-2 text-sm"
              style={field}
            />
            <button
              onClick={() => void sync.signIn(mail, password)}
              disabled={sync.state === "running" || mail === "" || password === ""}
              className="p-2 text-sm cursor-pointer border-none"
              style={{ background: INK, color: "#fff" }}
            >
              {sync.state === "running" ? "Connexion…" : "Se connecter"}
            </button>
          </div>
        </>
      )}

      {sync.email && (
        <>
          <p className="m-0 mb-2 text-xs" style={{ color: MUTED }}>
            Connecté avec {sync.email}. Les données remontent toutes seules au démarrage et
            au retour du réseau.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => void sync.run()}
              disabled={sync.state === "running"}
              className="flex-1 p-2 text-sm cursor-pointer border-none"
              style={{ background: INK, color: "#fff" }}
            >
              {sync.state === "running" ? "Synchronisation…" : "Synchroniser maintenant"}
            </button>
            <button
              onClick={() => void sync.signOut()}
              className="p-2 px-3 text-sm cursor-pointer"
              style={{ border: `1px solid ${LINE}`, background: "#fff", color: MUTED }}
            >
              Déconnexion
            </button>
          </div>
        </>
      )}

      {sync.message && (
        <div
          className="mt-2 p-2 text-xs"
          style={
            sync.state === "error"
              ? { background: WARN_BG, color: WARN_TX }
              : { color: MUTED }
          }
        >
          {sync.message}
        </div>
      )}
    </div>
  );
}

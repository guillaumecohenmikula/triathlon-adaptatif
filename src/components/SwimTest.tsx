import { useState } from "react";
import { frDate } from "../lib/date";
import { cssPace, formatPace, formatTime, isValidTest, parseTime, swimPaces } from "../lib/swim";
import type { SwimTest as SwimTestValue } from "../store/db";
import { INK, LINE, MUTED, WARN_BG, WARN_TX } from "../theme";

interface Props {
  test?: SwimTestValue;
  /** Lundi ISO de la semaine en cours, pour dater le test. */
  today: string;
  onSave: (test: SwimTestValue) => void;
  onClear: () => void;
}

const field = {
  border: `1px solid ${LINE}`,
  background: "#fff",
  color: INK,
};

/**
 * Test CSS : deux chronos suffisent à caler toutes les allures de natation.
 * Sans lui, les séances ne peuvent parler qu'en ressenti.
 */
export function SwimTest({ test, today, onSave, onClear }: Props) {
  const [t400, setT400] = useState(test ? formatTime(test.t400) : "");
  const [t200, setT200] = useState(test ? formatTime(test.t200) : "");
  const [error, setError] = useState("");

  const css = test ? cssPace(test.t400, test.t200) : null;
  const paces = css !== null ? swimPaces(css) : null;

  const submit = () => {
    const a = parseTime(t400);
    const b = parseTime(t200);
    if (a === null || b === null) {
      setError("Écris les temps en minutes et secondes, par exemple 8:00.");
      return;
    }
    if (!isValidTest(a, b)) {
      setError("Ces deux temps ne collent pas. Le 400 m doit être plus lent au 100 m que le 200 m.");
      return;
    }
    setError("");
    onSave({ t400: a, t200: b, date: today });
  };

  return (
    <div>
      <p className="m-0 mb-1 text-sm font-medium">Mon allure en natation</p>
      <p className="m-0 mb-3 text-xs" style={{ color: MUTED }}>
        Deux chronos suffisent à caler toutes tes séances de nage. Échauffe-toi 10 min, nage
        <strong> 400 m à fond</strong>, récupère vraiment (5 à 10 min souple), puis
        <strong> 200 m à fond</strong>. À refaire toutes les 6 à 8 semaines.
      </p>

      <div className="flex gap-2 mb-2">
        <label className="flex-1 text-xs" style={{ color: MUTED }}>
          400 m
          <input
            value={t400}
            onChange={(e) => setT400(e.target.value)}
            placeholder="8:00"
            inputMode="numeric"
            className="w-full p-2 mt-1 text-sm"
            style={field}
          />
        </label>
        <label className="flex-1 text-xs" style={{ color: MUTED }}>
          200 m
          <input
            value={t200}
            onChange={(e) => setT200(e.target.value)}
            placeholder="3:40"
            inputMode="numeric"
            className="w-full p-2 mt-1 text-sm"
            style={field}
          />
        </label>
      </div>

      {error && (
        <div className="p-2 mb-2 text-xs" style={{ background: WARN_BG, color: WARN_TX }}>
          {error}
        </div>
      )}

      <button
        onClick={submit}
        className="w-full p-2 text-sm cursor-pointer border-none"
        style={{ background: INK, color: "#fff" }}
      >
        {test ? "Mettre à jour mon allure" : "Calculer mon allure"}
      </button>

      {css !== null && paces && test && (
        <div className="mt-3 p-3" style={{ background: "#fff", border: `1px solid ${LINE}` }}>
          <div className="flex justify-between items-baseline mb-2">
            <p className="m-0 text-xs" style={{ color: MUTED }}>
              Testé le {frDate(test.date)}
            </p>
            <button
              onClick={onClear}
              className="text-xs bg-transparent border-none p-0 cursor-pointer"
              style={{ color: MUTED, textDecoration: "underline" }}
            >
              Effacer
            </button>
          </div>

          <div className="flex justify-between text-sm mb-1">
            <span>Seuil, ton allure de référence</span>
            <span style={{ fontWeight: 500 }}>{formatPace(paces.seuil)}/100m</span>
          </div>
          <div className="flex justify-between text-sm mb-1" style={{ color: MUTED }}>
            <span>Endurance</span>
            <span>{formatPace(paces.endurance)}/100m</span>
          </div>
          <div className="flex justify-between text-sm" style={{ color: MUTED }}>
            <span>Vitesse</span>
            <span>{formatPace(paces.vitesse)}/100m</span>
          </div>

          <p className="m-0 mt-2 text-xs" style={{ color: MUTED }}>
            À cette allure, les 1 500 m de l'épreuve te prendraient environ{" "}
            {Math.round((paces.seuil * 15) / 60)} min.
          </p>
        </div>
      )}
    </div>
  );
}

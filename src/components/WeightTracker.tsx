import { useState } from "react";
import { frDate } from "../lib/date";
import type { WeightRow } from "../store/db";
import { INK, LINE, MUTED } from "../theme";

interface Props {
  weights: WeightRow[];
  /** Semaine en cours, celle que la saisie renseigne. */
  week: string;
  onRecord: (week: string, kg: number) => void;
}

/** Décimale à la française : 80,9 et non 80.9. */
const kg = (n: number) => n.toFixed(1).replace(".", ",");

const W = 320;
const H = 110;
const PAD = { top: 14, right: 8, bottom: 18, left: 8 };

/** Courbe du poids. Une seule série, donc pas de légende : le titre la nomme. */
function Curve({ points }: { points: WeightRow[] }) {
  const kgs = points.map((p) => p.kg);
  const lo = Math.floor(Math.min(...kgs) - 1);
  const hi = Math.ceil(Math.max(...kgs) + 1);
  const span = hi - lo || 1;

  const x = (i: number) =>
    PAD.left + (i * (W - PAD.left - PAD.right)) / Math.max(1, points.length - 1);
  const y = (kg: number) => PAD.top + ((hi - kg) / span) * (H - PAD.top - PAD.bottom);

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.kg)}`).join(" ");
  const first = points[0];
  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      role="img"
      aria-label={`Poids de ${kg(first.kg)} kg le ${frDate(first.week)} à ${kg(last.kg)} kg le ${frDate(last.week)}`}
      style={{ display: "block" }}
    >
      {/* Repères horizontaux, volontairement discrets */}
      {[lo, (lo + hi) / 2, hi].map((v) => (
        <line key={v} x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke={LINE} strokeWidth="1" />
      ))}

      <path d={path} fill="none" stroke={INK} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {points.map((p, i) => (
        <circle key={p.week} cx={x(i)} cy={y(p.kg)} r="4" fill={INK} stroke="#fff" strokeWidth="2" />
      ))}

      {/* Une seule étiquette dans le tracé : le point de départ. La valeur du jour est
          affichée en clair au-dessus du graphique, où elle ne chevauche rien. */}
      {points.length > 1 && (
        <text x={PAD.left} y={y(first.kg) - 9} fontSize="11" fill={MUTED}>
          {kg(first.kg)}
        </text>
      )}

      <text x={PAD.left} y={H - 4} fontSize="10" fill={MUTED}>
        {frDate(first.week)}
      </text>
      {points.length > 1 && (
        <text x={W - PAD.right} y={H - 4} fontSize="10" fill={MUTED} textAnchor="end">
          {frDate(last.week)}
        </text>
      )}
    </svg>
  );
}

export function WeightTracker({ weights, week, onRecord }: Props) {
  const current = weights.find((w) => w.week === week);
  const [draft, setDraft] = useState("");

  const recent = weights.slice(-12);
  const first = recent[0];
  const last = recent[recent.length - 1];
  const delta = first && last && recent.length > 1 ? last.kg - first.kg : null;

  const submit = () => {
    const kg = Number(draft.replace(",", "."));
    if (!Number.isFinite(kg) || kg <= 0) return;
    onRecord(week, Math.round(kg * 10) / 10);
    setDraft("");
  };

  return (
    <div className="mb-4 p-3" style={{ background: "#fff", border: `1px solid ${LINE}` }}>
      <div className="flex justify-between items-start mb-2">
        <p className="m-0 text-sm font-medium">Poids</p>
        {last && (
          <div className="text-right">
            <p className="m-0 text-base font-medium leading-none">{kg(last.kg)} kg</p>
            {delta !== null && (
              <p className="m-0 mt-1 text-xs" style={{ color: MUTED }}>
                {delta > 0 ? "+" : "−"}
                {Math.abs(delta).toFixed(1).replace(".", ",")} kg sur {recent.length} semaines
              </p>
            )}
          </div>
        )}
      </div>

      {recent.length > 0 ? (
        <Curve points={recent} />
      ) : (
        <p className="m-0 mb-2 text-xs" style={{ color: MUTED }}>
          Note ton poids une fois par semaine, toujours dans les mêmes conditions. La courbe compte
          plus que le chiffre du jour.
        </p>
      )}

      <div className="flex gap-2 mt-2">
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={current ? kg(current.kg) : "kg"}
          aria-label="Poids en kilogrammes"
          className="flex-1 p-2 text-sm"
          style={{ border: `1px solid ${LINE}`, background: "#fff", color: INK }}
        />
        <button
          onClick={submit}
          disabled={draft.trim() === ""}
          className="px-4 text-sm cursor-pointer border-none"
          style={{ background: draft.trim() === "" ? LINE : INK, color: "#fff" }}
        >
          {current ? "Corriger" : "Noter"}
        </button>
      </div>
      <p className="m-0 mt-2 text-xs" style={{ color: MUTED }}>
        {current
          ? `Cette semaine : ${kg(current.kg)} kg.`
          : "Aucune pesée cette semaine."}
      </p>
    </div>
  );
}

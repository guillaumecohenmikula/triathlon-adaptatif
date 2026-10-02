import { ACCENT, INK, LINE, MUTED, PAPER } from "../theme";

export type Tab = "semaine" | "bibliotheque" | "mesures" | "reglages";

const ENTRIES: [Tab, string][] = [
  ["semaine", "Semaine"],
  ["bibliotheque", "Séances"],
  ["mesures", "Mesures"],
  ["reglages", "Réglages"],
];

export function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <div
      className="flex mt-8"
      style={{
        position: "sticky",
        bottom: 0,
        background: PAPER,
        borderTop: `1px solid ${LINE}`,
        paddingTop: 6,
        paddingBottom: 6,
      }}
    >
      {ENTRIES.map(([id, label]) => {
        const on = tab === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="flex-1 cursor-pointer border-none bg-transparent"
            style={{
              paddingTop: 12,
              paddingBottom: 12,
              color: on ? INK : MUTED,
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: on ? 600 : 400,
              borderTop: `2px solid ${on ? ACCENT : "transparent"}`,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

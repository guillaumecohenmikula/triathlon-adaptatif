import { INK, LINE, MUTED, PAPER } from "../theme";

export type Tab = "semaine" | "historique" | "reglages" | "periodes";

const ENTRIES: [Tab, string][] = [
  ["semaine", "Semaine"],
  ["historique", "Historique"],
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
        // Le plan par période est une sous-vue des réglages, l'onglet reste allumé.
        const on = tab === id || (id === "reglages" && tab === "periodes");
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="flex-1 cursor-pointer border-none bg-transparent"
            style={{
              paddingTop: 10,
              paddingBottom: 10,
              color: on ? INK : MUTED,
              fontSize: 13,
              fontWeight: on ? 500 : 400,
              borderTop: `2px solid ${on ? INK : "transparent"}`,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

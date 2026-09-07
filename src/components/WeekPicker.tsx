import { frDate } from "../lib/date";
import { INK, LINE, MUTED } from "../theme";

interface Props {
  week: string;
  /** Écart en semaines avec la semaine en cours. 0 = celle-ci. */
  offset: number;
  canGoBack: boolean;
  canGoForward: boolean;
  onGo: (delta: number) => void;
  onBackToCurrent: () => void;
}

const relative = (offset: number) => {
  if (offset === 0) return "cette semaine";
  if (offset === 1) return "la semaine prochaine";
  if (offset === -1) return "la semaine dernière";
  return offset > 0 ? `dans ${offset} semaines` : `il y a ${-offset} semaines`;
};

const arrow = (enabled: boolean) => ({
  width: 40,
  height: 40,
  border: `1px solid ${LINE}`,
  background: "#fff",
  color: enabled ? INK : LINE,
  fontSize: 16,
  cursor: enabled ? "pointer" : "default",
});

/** Choix de la semaine à planifier. Le passé se consulte, l'avenir se prépare. */
export function WeekPicker({ week, offset, canGoBack, canGoForward, onGo, onBackToCurrent }: Props) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onGo(-1)}
          disabled={!canGoBack}
          aria-label="Semaine précédente"
          style={arrow(canGoBack)}
        >
          ‹
        </button>

        <div className="flex-1 text-center">
          <p className="m-0 text-sm font-medium">Semaine du {frDate(week)}</p>
          <p className="m-0 text-xs" style={{ color: MUTED }}>
            {relative(offset)}
          </p>
        </div>

        <button
          onClick={() => onGo(1)}
          disabled={!canGoForward}
          aria-label="Semaine suivante"
          style={arrow(canGoForward)}
        >
          ›
        </button>
      </div>

      {offset !== 0 && (
        <button
          onClick={onBackToCurrent}
          className="w-full mt-2 text-xs bg-transparent border-none cursor-pointer"
          style={{ color: MUTED, padding: 4 }}
        >
          Revenir à cette semaine
        </button>
      )}
    </div>
  );
}

import type { Item, ItemKind, Movement } from "../data/types";
import { clock } from "../engine/rest";
import { INK, LINE, MUTED } from "../theme";

interface Props {
  item: Item;
  movements: Movement[];
  onChange: (patch: Partial<Item>) => void;
  onRemove: () => void;
  onMove: (delta: -1 | 1) => void;
  first: boolean;
  last: boolean;
}

const KINDS: [ItemKind, string][] = [
  ["reps", "Exercice"],
  ["time", "Durée"],
  ["distance", "Distance"],
];

const field = {
  border: `1px solid ${LINE}`,
  background: "#fff",
  color: INK,
  fontSize: 16,
  padding: 8,
  width: "100%",
};

const num = (v: string) => (v.trim() === "" ? undefined : Number(v.replace(",", ".")));

/** Édition d'un élément de séance : un exercice, un bloc de durée, une distance. */
export function ItemEditor({ item, movements, onChange, onRemove, onMove, first, last }: Props) {
  const label = (text: string) => (
    <p className="m-0 mb-1 text-xs" style={{ color: MUTED }}>
      {text}
    </p>
  );

  const small = {
    ...field,
    width: "auto",
    flex: 1,
    minWidth: 0,
  };

  return (
    <div className="p-3 mb-2" style={{ background: "#fff", border: `1px solid ${LINE}` }}>
      <div className="flex gap-2 mb-2">
        <select
          value={item.movement ?? ""}
          onChange={(e) => {
            const m = movements.find((x) => x.id === e.target.value);
            onChange(
              m
                ? { movement: m.id, label: m.name, kind: m.kind }
                : { movement: undefined },
            );
          }}
          style={{ ...field, width: "auto", flex: 1, minWidth: 0 }}
        >
          <option value="">Libre</option>
          {movements.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => onMove(-1)}
          disabled={first}
          aria-label="Monter"
          style={{ width: 40, height: 40, border: `1px solid ${LINE}`, background: "#fff", color: first ? LINE : INK }}
        >
          ↑
        </button>
        <button
          onClick={() => onMove(1)}
          disabled={last}
          aria-label="Descendre"
          style={{ width: 40, height: 40, border: `1px solid ${LINE}`, background: "#fff", color: last ? LINE : INK }}
        >
          ↓
        </button>
      </div>

      <input
        value={item.label}
        onChange={(e) => onChange({ label: e.target.value })}
        placeholder="Nom de l'exercice ou de l'étape"
        style={{ ...field, marginBottom: 8 }}
      />

      <div className="flex gap-1 mb-2">
        {KINDS.map(([kind, text]) => {
          const on = item.kind === kind;
          return (
            <button
              key={kind}
              onClick={() => onChange({ kind })}
              className="flex-1 text-sm cursor-pointer"
              style={{
                height: 36,
                border: `1px solid ${on ? INK : LINE}`,
                background: on ? INK : "#fff",
                color: on ? "#fff" : MUTED,
              }}
            >
              {text}
            </button>
          );
        })}
      </div>

      {item.kind === "reps" && (
        <div className="flex gap-2 mb-2">
          <div style={{ flex: 1, minWidth: 0 }}>
            {label("Séries")}
            <input
              value={item.sets ?? ""}
              onChange={(e) => onChange({ sets: num(e.target.value) })}
              inputMode="numeric"
              style={small}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {label("Répétitions")}
            <input
              value={item.reps ?? ""}
              onChange={(e) => onChange({ reps: e.target.value })}
              placeholder="8"
              style={small}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {label("Repos")}
            <input
              value={item.rest ? clock(item.rest) : ""}
              onChange={(e) => {
                const [m, s] = e.target.value.split(":");
                const secs = Number(m) * 60 + Number(s ?? 0);
                onChange({ rest: Number.isFinite(secs) && secs > 0 ? secs : undefined });
              }}
              placeholder="1:30"
              style={small}
            />
          </div>
        </div>
      )}

      {item.kind === "reps" && (
        <div className="mb-2">
          {label("Charge")}
          <input
            value={item.load ?? ""}
            onChange={(e) => onChange({ load: e.target.value })}
            placeholder="60 kg, élastique, poids du corps…"
            style={field}
          />
        </div>
      )}

      {item.kind === "time" && (
        <div className="mb-2">
          <div className="flex gap-2">
            <div style={{ flex: 1, minWidth: 0 }}>
              {label("Minutes")}
              <input
                value={item.minutes ?? ""}
                onChange={(e) => onChange({ minutes: num(e.target.value) })}
                inputMode="numeric"
                style={small}
              />
            </div>
            <div style={{ flex: 2, minWidth: 0 }}>
              {label("Intervalles (séries × minutes / récup)")}
              <div className="flex gap-1 items-center">
                <input
                  value={item.rep?.n ?? ""}
                  onChange={(e) => {
                    const n = num(e.target.value);
                    onChange({
                      rep: n ? { n, work: item.rep?.work ?? 8, rest: item.rep?.rest ?? 3 } : undefined,
                    });
                  }}
                  inputMode="numeric"
                  placeholder="4"
                  style={{ ...small, textAlign: "center" }}
                />
                <span style={{ color: MUTED }}>×</span>
                <input
                  value={item.rep?.work ?? ""}
                  onChange={(e) =>
                    item.rep && onChange({ rep: { ...item.rep, work: num(e.target.value) ?? 0 } })
                  }
                  inputMode="numeric"
                  placeholder="8"
                  style={{ ...small, textAlign: "center" }}
                />
                <span style={{ color: MUTED }}>/</span>
                <input
                  value={item.rep?.rest ?? ""}
                  onChange={(e) =>
                    item.rep && onChange({ rep: { ...item.rep, rest: num(e.target.value) ?? 0 } })
                  }
                  inputMode="numeric"
                  placeholder="3"
                  style={{ ...small, textAlign: "center" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {item.kind === "distance" && (
        <div className="mb-2">
          {label("Mètres")}
          <input
            value={item.distance ?? ""}
            onChange={(e) => onChange({ distance: num(e.target.value) })}
            inputMode="numeric"
            style={field}
          />
        </div>
      )}

      <div className="mb-2">
        {label("Consigne")}
        <textarea
          value={item.note ?? ""}
          onChange={(e) => onChange({ note: e.target.value })}
          rows={2}
          placeholder="Ce que tu veux te rappeler pendant l'effort"
          style={{ ...field, resize: "vertical" }}
        />
      </div>

      <button
        onClick={onRemove}
        className="text-xs cursor-pointer"
        style={{ border: "none", background: "transparent", color: MUTED, padding: 0 }}
      >
        Retirer cet élément
      </button>
    </div>
  );
}

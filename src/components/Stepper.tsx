import { INK, LINE } from "../theme";

interface Props {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  label: string;
}

/** Plus et moins autour d'une valeur : plus sûr au pouce qu'un champ numérique. */
export function Stepper({ value, onChange, min, max, step, format, label }: Props) {
  const button = (enabled: boolean) => ({
    width: 52,
    height: 48,
    border: `1px solid ${LINE}`,
    background: "#fff",
    color: enabled ? INK : LINE,
    fontSize: 22,
    cursor: enabled ? "pointer" : "default",
  });

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        aria-label={`${label} : moins`}
        style={button(value > min)}
      >
        −
      </button>
      <p className="m-0 flex-1 text-center" style={{ fontSize: 22, fontWeight: 500 }}>
        {format(value)}
      </p>
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
        aria-label={`${label} : plus`}
        style={button(value < max)}
      >
        +
      </button>
    </div>
  );
}

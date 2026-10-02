import type { ReactNode } from "react";
import type { ExerciseGuide } from "../data/guides";
import type { Drill, SessionGuide } from "../data/sessionGuides";
import { CARD, INK, LINE, MUTED, R } from "../theme";

/** Section repliable. Ouverte par défaut pour ce qui sert pendant l'effort. */
export function Fold({
  title,
  open = false,
  children,
}: {
  title: string;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={open} className="mb-2" style={{ background: CARD, border: `1px solid ${LINE}` , borderRadius: R.card}}>
      <summary className="flex justify-between items-center p-3 text-sm font-medium cursor-pointer">
        {title}
        <span className="fold" style={{ color: MUTED, fontSize: 18, fontWeight: 400 }} />
      </summary>
      <div className="px-3 pb-3 text-sm" style={{ color: INK, lineHeight: 1.5 }}>
        {children}
      </div>
    </details>
  );
}

export function Points({ items, numbered = false }: { items: string[]; numbered?: boolean }) {
  return (
    <div>
      {items.map((text, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <span style={{ color: MUTED, minWidth: 14 }}>{numbered ? `${i + 1}.` : "•"}</span>
          <span>{text}</span>
        </div>
      ))}
    </div>
  );
}

const Label = ({ children }: { children: ReactNode }) => (
  <p className="m-0 mb-2 text-xs" style={{ color: MUTED }}>
    {children}
  </p>
);

/** La fiche d'un mouvement de renfo. `titled` quand l'exercice en regroupe plusieurs. */
export function ExerciseGuideView({ guide, titled }: { guide: ExerciseGuide; titled: boolean }) {
  return (
    <div className="mb-4">
      {titled && <p className="m-0 mb-1 text-base font-medium">{guide.name}</p>}
      <p className="m-0 mb-2 text-xs" style={{ color: MUTED }}>
        {guide.muscles}
      </p>

      <Fold title="Exécution" open>
        <Label>Mise en place</Label>
        <Points items={guide.setup} />
        <div className="mt-3">
          <Label>Le mouvement</Label>
          <Points items={guide.steps} numbered />
        </div>
        <p className="m-0 mt-3">
          <span style={{ color: MUTED }}>Respiration · </span>
          {guide.breathing}
        </p>
      </Fold>

      <Fold title="Erreurs fréquentes">
        <Points items={guide.mistakes} />
      </Fold>

      <Fold title="Plus facile, plus dur">
        <p className="m-0 mb-2">
          <span style={{ color: MUTED }}>Plus facile · </span>
          {guide.easier}
        </p>
        <p className="m-0">
          <span style={{ color: MUTED }}>Plus dur · </span>
          {guide.harder}
        </p>
      </Fold>

      <Fold title="Pourquoi cet exercice">
        <p className="m-0">{guide.why}</p>
      </Fold>
    </div>
  );
}

export function DrillsView({ drills }: { drills: Drill[] }) {
  return (
    <div>
      {drills.map((d) => (
        <div key={d.name} className="mb-3">
          <p className="m-0 font-medium">{d.name}</p>
          <p className="m-0">{d.how}</p>
          <p className="m-0" style={{ color: MUTED }}>
            {d.focus}
          </p>
        </div>
      ))}
    </div>
  );
}

/** Le discours du coach sur une séance d'endurance. */
export function SessionGuideView({ guide, color }: { guide: SessionGuide; color: string }) {
  return (
    <div className="mb-4">
      <div className="p-3 mb-2" style={{ background: CARD, borderLeft: `3px solid ${color}` , borderRadius: R.card}}>
        <p className="m-0 mb-1 text-xs" style={{ color: MUTED }}>
          Le but de la séance
        </p>
        <p className="m-0 text-sm" style={{ lineHeight: 1.5 }}>
          {guide.goal}
        </p>
      </div>

      <Fold title="Comment doser l'effort" open>
        <Points items={guide.intensity} />
      </Fold>
      {guide.drills && (
        <Fold title="Les éducatifs">
          <DrillsView drills={guide.drills} />
        </Fold>
      )}
      <Fold title="Technique">
        <Points items={guide.technique} />
      </Fold>
      <Fold title="Erreurs fréquentes">
        <Points items={guide.mistakes} />
      </Fold>
      {guide.practical && (
        <Fold title="Côté pratique">
          <Points items={guide.practical} />
        </Fold>
      )}
    </div>
  );
}

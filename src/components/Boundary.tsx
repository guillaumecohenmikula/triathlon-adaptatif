import { Component } from "react";
import type { ReactNode } from "react";

interface State {
  message: string | null;
}

/**
 * Sans ça, la moindre erreur de rendu vide l'écran sans un mot, et l'app paraît
 * simplement figée. On préfère afficher ce qui a cassé : c'est la seule chose
 * exploitable depuis un téléphone.
 */
export class Boundary extends Component<{ children: ReactNode }, State> {
  state: State = { message: null };

  static getDerivedStateFromError(e: unknown): State {
    return { message: e instanceof Error ? e.message : String(e) };
  }

  render() {
    if (this.state.message === null) return this.props.children;
    return (
      <div className="p-4" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        <p className="m-0 mb-2 text-base font-medium">L'app s'est arrêtée</p>
        <p className="m-0 mb-4 text-sm" style={{ color: "#7A6A55" }}>
          {this.state.message}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full cursor-pointer border-none"
          style={{ height: 44, background: "#12202B", color: "#fff", fontSize: 14 }}
        >
          Recharger
        </button>
      </div>
    );
  }
}

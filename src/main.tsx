import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { watchForUpdates } from "./pwa";

/**
 * Demande au navigateur de ne pas évincer les données sous pression de stockage.
 * Sans ça, un nettoyage automatique peut effacer le journal, les pesées et les semaines,
 * qui n'existent nulle part ailleurs. Accordé silencieusement quand l'app est installée
 * sur l'écran d'accueil, refusé sans conséquence ailleurs.
 */
void navigator.storage?.persist?.().catch(() => {});

watchForUpdates();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

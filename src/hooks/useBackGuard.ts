import { useEffect, useRef } from "react";

/*
 * Retenir le bouton Retour du téléphone, niveau par niveau.
 *
 * Une app installée n'a pas d'historique : sans ça, le retour système quitte l'app au lieu
 * de revenir à l'écran précédent. Chaque niveau ouvert pose donc une entrée d'historique.
 *
 * Les niveaux sont empilés ici et non chacun dans leur coin : un même événement de retour
 * est reçu par tous les écouteurs, donc un retour fermait d'un coup le pas-à-pas et la
 * séance qui le contient. Seul le niveau le plus haut doit répondre.
 */

interface Guard {
  fire: () => void;
  popped: boolean;
}

const stack: Guard[] = [];
let listening = false;
/** Retours déclenchés par l'app elle-même, dont l'événement ne doit fermer personne. */
let ourOwn = 0;

function onPop() {
  if (ourOwn > 0) {
    ourOwn -= 1;
    return;
  }
  const top = stack.pop();
  if (!top) return;
  top.popped = true;
  top.fire();
}

export function useBackGuard(active: boolean, onBack: () => void) {
  const handler = useRef(onBack);
  useEffect(() => {
    handler.current = onBack;
  });

  useEffect(() => {
    if (!active) return;
    if (!listening) {
      window.addEventListener("popstate", onPop);
      listening = true;
    }

    const guard: Guard = { fire: () => handler.current(), popped: false };
    stack.push(guard);
    window.history.pushState({ guard: true }, "");

    return () => {
      const at = stack.indexOf(guard);
      if (at >= 0) stack.splice(at, 1);
      // Fermé depuis l'app : on retire l'entrée posée à l'ouverture, sans que le retour
      // qui en découle referme le niveau d'en dessous.
      if (!guard.popped) {
        ourOwn += 1;
        window.history.back();
      }
    };
  }, [active]);
}

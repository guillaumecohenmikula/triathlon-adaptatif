/// <reference types="vite-plugin-pwa/client" />
import { registerSW } from "virtual:pwa-register";

/**
 * Une app installée sur l'écran d'accueil reste en mémoire des jours durant, et ne
 * recharge donc jamais la page : sans cela, elle continue de servir l'ancienne version
 * bien après un déploiement. On force une vérification à chaque retour sur l'app, et
 * une fois par heure quand elle reste ouverte.
 */
export function watchForUpdates() {
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => {
        if (document.visibilityState === "visible") void registration.update();
      };
      document.addEventListener("visibilitychange", check);
      window.addEventListener("online", check);
      setInterval(check, 60 * 60 * 1000);
    },
  });
}

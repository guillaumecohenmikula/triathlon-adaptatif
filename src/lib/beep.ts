/*
 * Signaux sonores du chrono et du minuteur de repos.
 *
 * Safari n'autorise le son qu'après un geste de l'utilisateur : `unlockAudio` doit être
 * appelé dans le gestionnaire d'un appui. En mode silencieux, iOS coupe ces sons, et
 * Safari ne sait pas faire vibrer : l'écran reste la référence.
 */

type AudioCtor = typeof AudioContext;

let ctx: AudioContext | null = null;

export function unlockAudio() {
  const Ctor: AudioCtor | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
  if (!Ctor) return;
  ctx ??= new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
}

function tone(freq: number, delay: number, ms: number) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.5, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + ms / 1000 + 0.05);
}

/** Bip court, pour les trois dernières secondes. */
export const tick = () => tone(660, 0, 110);

/** Double bip montant, au changement de phase. Vibre aussi là où c'est possible. */
export function chime() {
  tone(880, 0, 180);
  tone(1175, 0.22, 280);
  navigator.vibrate?.([200, 100, 200]);
}

import type { PersistedPlayer, RepeatMode } from "./types";

const KEY = "musica.player";

export function loadPlayerState(): PersistedPlayer | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<PersistedPlayer>;
    const repeat: RepeatMode =
      p.repeat === "all" || p.repeat === "one" || p.repeat === "off" ? p.repeat : "off";
    return {
      queueIds: Array.isArray(p.queueIds) ? p.queueIds.map(Number).filter(Number.isFinite) : [],
      index: Number.isFinite(p.index) ? Number(p.index) : 0,
      progress: Number.isFinite(p.progress) ? Number(p.progress) : 0,
      shuffle: !!p.shuffle,
      repeat,
      volume: Number.isFinite(p.volume) ? Math.min(1, Math.max(0, Number(p.volume))) : 1,
      speed: Number.isFinite(p.speed) ? Number(p.speed) : 1,
      crossfade: Number.isFinite(p.crossfade) ? Number(p.crossfade) : 0,
    };
  } catch {
    return null;
  }
}

export function savePlayerState(state: PersistedPlayer): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* modo privado / quota */
  }
}

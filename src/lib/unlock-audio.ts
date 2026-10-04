/** WAV silencioso de 1 amostra — desbloqueia o áudio no gesto de toque do iOS. */
const SILENT_WAV =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

let primed = false;
let silent: HTMLAudioElement | null = null;

export function primeAudioElement(audio: HTMLAudioElement | null): void {
  if (audio) {
    audio.setAttribute("playsinline", "true");
    audio.setAttribute("webkit-playsinline", "true");
  }
  if (primed) return;
  if (!silent) {
    silent = document.createElement("audio");
    silent.setAttribute("playsinline", "true");
    silent.setAttribute("webkit-playsinline", "true");
    silent.preload = "auto";
    silent.src = SILENT_WAV;
    silent.volume = 0.01;
    silent.style.display = "none";
    document.body.appendChild(silent);
  }
  void silent
    .play()
    .catch(() => undefined)
    .finally(() => {
      silent?.pause();
      primed = true;
    });
}

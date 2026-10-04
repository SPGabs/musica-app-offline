const EXT_MIME: Record<string, string> = {
  mp3: "audio/mpeg",
  mpeg: "audio/mpeg",
  mpga: "audio/mpeg",
  m4a: "audio/mp4",
  mp4: "audio/mp4",
  aac: "audio/aac",
  wav: "audio/wav",
  wave: "audio/wav",
  flac: "audio/flac",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  opus: "audio/ogg",
  aiff: "audio/aiff",
  aif: "audio/aiff",
  alac: "audio/mp4",
  caf: "audio/x-caf",
};

function extname(name: string): string {
  const d = name.lastIndexOf(".");
  return d >= 0 ? name.slice(d + 1).toLowerCase() : "";
}

/** MIME a partir do nome — no iOS o File.type da app Ficheiros vem muitas vezes vazio. */
export function inferAudioMime(fileName: string, stored?: string): string {
  const ext = extname(fileName);
  if (ext && EXT_MIME[ext]) return EXT_MIME[ext];
  if (stored && stored.startsWith("audio/")) return stored;
  return "audio/mpeg";
}

export function mimeFromFile(file: File): string {
  return inferAudioMime(file.name, file.type);
}

export function audioExtension(fileName: string, mime?: string): string {
  const ext = extname(fileName);
  if (ext && EXT_MIME[ext]) return `.${ext === "wave" ? "wav" : ext}`;
  const m = (mime || "").toLowerCase();
  if (m.includes("mp4") || m.includes("aac") || m.includes("m4a")) return ".m4a";
  if (m.includes("wav")) return ".wav";
  if (m.includes("flac")) return ".flac";
  if (m.includes("ogg") || m.includes("opus")) return ".ogg";
  return ".mp3";
}

export function isAwkwardOnIOS(fileName: string): boolean {
  return ["flac", "ogg", "oga", "opus", "wma"].includes(extname(fileName));
}

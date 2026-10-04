import jsmediatags from "jsmediatags";

export interface AudioTags {
  title?: string;
  artist?: string;
  album?: string;
  coverBlob?: Blob;
  coverContentType?: string;
}

/** Lê metadados ID3 / MP4 de um ficheiro de áudio no navegador. */
export async function readAudioTags(file: File): Promise<AudioTags> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (tags: AudioTags) => {
      if (settled) return;
      settled = true;
      resolve(tags);
    };
    const timer = setTimeout(() => finish({}), 5000);
    try {
      jsmediatags.read(file, {
        onSuccess: (tag) => {
          clearTimeout(timer);
          const t = tag.tags as Record<string, unknown> & {
            picture?: { data: number[]; format: string };
          };
          let coverBlob: Blob | undefined;
          let coverContentType: string | undefined;
          if (t.picture && t.picture.data?.length) {
            coverBlob = new Blob([new Uint8Array(t.picture.data)], {
              type: t.picture.format || "image/jpeg",
            });
            coverContentType = t.picture.format || "image/jpeg";
          }
          finish({
            title: (t.title as string) || undefined,
            artist: (t.artist as string) || undefined,
            album: (t.album as string) || undefined,
            coverBlob,
            coverContentType,
          });
        },
        onError: () => {
          clearTimeout(timer);
          finish({});
        },
      });
    } catch {
      clearTimeout(timer);
      finish({});
    }
  });
}

/** Mede a duração em segundos com um elemento Audio destacado. */
export function probeDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    let settled = false;
    const done = (sec: number) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      audio.removeAttribute("src");
      audio.load();
      resolve(Number.isFinite(sec) ? Math.round(sec) : 0);
    };
    audio.preload = "metadata";
    audio.onloadedmetadata = () => done(audio.duration);
    audio.onerror = () => done(0);
    audio.src = url;
    setTimeout(() => done(0), 8000);
  });
}

export function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Deriva um título limpo do nome do ficheiro quando não há tags. */
export function titleFromFileName(name: string): string {
  return name.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ").trim() || name;
}

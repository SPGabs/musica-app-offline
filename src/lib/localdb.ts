import { Capacitor } from "@capacitor/core";
import { audioExtension, inferAudioMime } from "./mime";
import type { Song } from "./types";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler o áudio"));
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const i = text.indexOf(",");
      resolve(i >= 0 ? text.slice(i + 1) : text);
    };
    reader.readAsDataURL(blob);
  });
}

/** Registo completo de uma música guardado no IndexedDB. */
export interface SongRecord extends Song {
  audio: Blob;
  cover: Blob | null;
  mime: string;
}

export interface PlaylistRecord {
  id: number;
  name: string;
  createdAt: number;
  songIds: number[];
}

const DB_NAME = "musica-local-db";
const DB_VERSION = 1;
const SONGS = "songs";
const PLAYLISTS = "playlists";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(SONGS)) {
          db.createObjectStore(SONGS, { keyPath: "id", autoIncrement: true });
        }
        if (!db.objectStoreNames.contains(PLAYLISTS)) {
          db.createObjectStore(PLAYLISTS, { keyPath: "id", autoIncrement: true });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        dbPromise = null;
        reject(req.error ?? new Error("Falha ao abrir a base local"));
      };
    });
  }
  return dbPromise;
}

function run<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        let result: T;
        req.onsuccess = () => {
          result = req.result;
        };
        t.oncomplete = () => resolve(result);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      }),
  );
}

export function listSongRecords(): Promise<SongRecord[]> {
  return run<SongRecord[]>(SONGS, "readonly", (s) => s.getAll() as IDBRequest<SongRecord[]>);
}

export function getSongRecord(id: number): Promise<SongRecord | undefined> {
  return run<SongRecord | undefined>(
    SONGS,
    "readonly",
    (s) => s.get(id) as IDBRequest<SongRecord | undefined>,
  );
}

export function addSongRecord(rec: Omit<SongRecord, "id">): Promise<number> {
  return run<IDBValidKey>(SONGS, "readwrite", (s) => s.add(rec)).then((k) => Number(k));
}

export function patchSongRecord(
  id: number,
  patch: Partial<Omit<SongRecord, "id">>,
): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const t = db.transaction(SONGS, "readwrite");
        const store = t.objectStore(SONGS);
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          const rec = getReq.result as SongRecord | undefined;
          if (rec) store.put({ ...rec, ...patch });
        };
        t.oncomplete = () => resolve();
        t.onerror = () => reject(t.error);
      }),
  );
}

export function deleteSongRecord(id: number): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const t = db.transaction([SONGS, PLAYLISTS], "readwrite");
        t.objectStore(SONGS).delete(id);
        const pl = t.objectStore(PLAYLISTS);
        const all = pl.getAll();
        all.onsuccess = () => {
          for (const p of all.result as PlaylistRecord[]) {
            if (p.songIds.includes(id)) {
              pl.put({ ...p, songIds: p.songIds.filter((s) => s !== id) });
            }
          }
        };
        t.oncomplete = () => resolve();
        t.onerror = () => reject(t.error);
      }),
  );
}

export function listPlaylistRecords(): Promise<PlaylistRecord[]> {
  return run<PlaylistRecord[]>(
    PLAYLISTS,
    "readonly",
    (s) => s.getAll() as IDBRequest<PlaylistRecord[]>,
  );
}

export function createPlaylistRecord(name: string): Promise<number> {
  const rec = { name, createdAt: Date.now(), songIds: [] as number[] };
  return run<IDBValidKey>(PLAYLISTS, "readwrite", (s) => s.add(rec)).then((k) => Number(k));
}

export function putPlaylistRecord(rec: PlaylistRecord): Promise<void> {
  return run(PLAYLISTS, "readwrite", (s) => s.put(rec)).then(() => undefined);
}

export function deletePlaylistRecord(id: number): Promise<void> {
  return run(PLAYLISTS, "readwrite", (s) => s.delete(id)).then(() => undefined);
}

const audioUrlCache = new Map<number, string>();
const coverUrlCache = new Map<number, string | null>();

export async function getAudioUrl(id: number): Promise<string | null> {
  const cached = audioUrlCache.get(id);
  if (cached) return cached;
  const rec = await getSongRecord(id);
  if (!rec?.audio) return null;

  const mime = inferAudioMime(rec.fileName, rec.mime);
  const copy = new Blob([new Uint8Array(await rec.audio.arrayBuffer())], { type: mime });

  // WKWebView (Capacitor) não reproduz blob: — gravamos um ficheiro e usamos convertFileSrc.
  if (Capacitor.isNativePlatform()) {
    const { Directory, Filesystem } = await import("@capacitor/filesystem");
    const path = `musica-play/${id}${audioExtension(rec.fileName, mime)}`;
    await Filesystem.writeFile({
      path,
      data: await blobToBase64(copy),
      directory: Directory.Cache,
      recursive: true,
    });
    const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache });
    const url = Capacitor.convertFileSrc(uri);
    audioUrlCache.set(id, url);
    return url;
  }

  const url = URL.createObjectURL(copy);
  audioUrlCache.set(id, url);
  return url;
}

export async function getCoverUrl(id: number): Promise<string | null> {
  if (coverUrlCache.has(id)) return coverUrlCache.get(id) ?? null;
  const rec = await getSongRecord(id);
  const url = rec?.cover ? URL.createObjectURL(rec.cover) : null;
  coverUrlCache.set(id, url);
  return url;
}

export function evictCoverUrl(id: number): void {
  const c = coverUrlCache.get(id);
  if (c) URL.revokeObjectURL(c);
  coverUrlCache.delete(id);
}

export function evictSongUrls(id: number): void {
  const a = audioUrlCache.get(id);
  if (a?.startsWith("blob:")) URL.revokeObjectURL(a);
  audioUrlCache.delete(id);
  evictCoverUrl(id);
}

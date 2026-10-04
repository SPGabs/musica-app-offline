import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PlaylistSummary, Song } from "@/lib/types";
import {
  addSongRecord,
  createPlaylistRecord,
  deletePlaylistRecord,
  deleteSongRecord,
  evictSongUrls,
  getCoverUrl,
  listPlaylistRecords,
  listSongRecords,
  putPlaylistRecord,
  updateSongMeta,
  type PlaylistRecord,
} from "@/lib/localdb";

export interface NewSongInput {
  file: File;
  title: string;
  artist: string;
  album: string;
  duration: number;
  cover: Blob | null;
}

interface LibraryState {
  /** true quando o IndexedDB já foi carregado */
  ready: boolean;
  songs: Song[];
  playlists: PlaylistSummary[];
  saveSong: (input: NewSongInput) => Promise<number>;
  updateSong: (
    id: number,
    patch: { title: string; artist: string; album: string },
  ) => Promise<void>;
  removeSong: (id: number) => Promise<void>;
  createPlaylist: (name: string) => Promise<number>;
  removePlaylist: (id: number) => Promise<void>;
  addToPlaylist: (playlistId: number, songId: number) => Promise<void>;
  removeFromPlaylist: (playlistId: number, songId: number) => Promise<void>;
  /** músicas de uma playlist, na ordem guardada (ignora ids inexistentes) */
  playlistSongs: (playlistId: number) => Song[];
}

const LibraryContext = createContext<LibraryState | null>(null);

function toSummary(p: PlaylistRecord, songs: Song[]): PlaylistSummary {
  const alive = new Set(songs.map((s) => s.id));
  const ids = p.songIds.filter((id) => alive.has(id));
  return {
    id: p.id,
    name: p.name,
    createdAt: p.createdAt,
    count: ids.length,
    coverSongId: ids[0] ?? null,
  };
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlistRecords, setPlaylistRecords] = useState<PlaylistRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([listSongRecords(), listPlaylistRecords()]).then(([s, p]) => {
      if (cancelled) return;
      const sorted = [...s].sort((a, b) => b.createdAt - a.createdAt);
      setSongs(sorted.map((r) => ({
        id: r.id, title: r.title, artist: r.artist, album: r.album,
        duration: r.duration, size: r.size, fileName: r.fileName, createdAt: r.createdAt,
      })));
      setPlaylistRecords(p);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const saveSong = useCallback(async (input: NewSongInput): Promise<number> => {
    const rec = {
      title: input.title,
      artist: input.artist,
      album: input.album,
      duration: input.duration,
      size: input.file.size,
      fileName: input.file.name,
      createdAt: Date.now(),
      // slice() garante um Blob puro (compatível com IndexedDB em todos os WebKit)
      audio: input.file.slice(0, input.file.size, input.file.type || "audio/mpeg"),
      cover: input.cover,
      mime: input.file.type || "audio/mpeg",
    };
    const id = await addSongRecord(rec);
    setSongs((prev) => [
      {
        id,
        title: rec.title,
        artist: rec.artist,
        album: rec.album,
        duration: rec.duration,
        size: rec.size,
        fileName: rec.fileName,
        createdAt: rec.createdAt,
      },
      ...prev,
    ]);
    return id;
  }, []);

  const updateSong = useCallback(
    async (id: number, patch: { title: string; artist: string; album: string }) => {
      await updateSongMeta(id, patch);
      setSongs((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    },
    [],
  );

  const removeSong = useCallback(async (id: number) => {
    await deleteSongRecord(id);
    evictSongUrls(id);
    setSongs((prev) => prev.filter((s) => s.id !== id));
    setPlaylistRecords((prev) =>
      prev.map((p) => ({ ...p, songIds: p.songIds.filter((s) => s !== id) })),
    );
  }, []);

  const createPlaylist = useCallback(async (name: string): Promise<number> => {
    const id = await createPlaylistRecord(name);
    setPlaylistRecords((prev) => [...prev, { id, name, createdAt: Date.now(), songIds: [] }]);
    return id;
  }, []);

  const removePlaylist = useCallback(async (id: number) => {
    await deletePlaylistRecord(id);
    setPlaylistRecords((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addToPlaylist = useCallback(
    async (playlistId: number, songId: number) => {
      const rec = playlistRecords.find((p) => p.id === playlistId);
      if (!rec || rec.songIds.includes(songId)) return;
      const next = { ...rec, songIds: [...rec.songIds, songId] };
      await putPlaylistRecord(next);
      setPlaylistRecords((prev) => prev.map((p) => (p.id === playlistId ? next : p)));
    },
    [playlistRecords],
  );

  const removeFromPlaylist = useCallback(
    async (playlistId: number, songId: number) => {
      const rec = playlistRecords.find((p) => p.id === playlistId);
      if (!rec) return;
      const idx = rec.songIds.indexOf(songId);
      if (idx < 0) return;
      const next = {
        ...rec,
        songIds: [...rec.songIds.slice(0, idx), ...rec.songIds.slice(idx + 1)],
      };
      await putPlaylistRecord(next);
      setPlaylistRecords((prev) => prev.map((p) => (p.id === playlistId ? next : p)));
    },
    [playlistRecords],
  );

  const playlists = useMemo(
    () => playlistRecords.map((p) => toSummary(p, songs)),
    [playlistRecords, songs],
  );

  const playlistSongs = useCallback(
    (playlistId: number): Song[] => {
      const rec = playlistRecords.find((p) => p.id === playlistId);
      if (!rec) return [];
      const map = new Map(songs.map((s) => [s.id, s]));
      return rec.songIds.map((id) => map.get(id)).filter((s): s is Song => !!s);
    },
    [playlistRecords, songs],
  );

  const value = useMemo<LibraryState>(
    () => ({
      ready,
      songs,
      playlists,
      saveSong,
      updateSong,
      removeSong,
      createPlaylist,
      removePlaylist,
      addToPlaylist,
      removeFromPlaylist,
      playlistSongs,
    }),
    [
      ready, songs, playlists, saveSong, updateSong, removeSong,
      createPlaylist, removePlaylist, addToPlaylist, removeFromPlaylist, playlistSongs,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used within LibraryProvider");
  return ctx;
}

/** Hook: devolve o object URL da capa de uma música (ou null). */
export function useCoverUrl(songId: number | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (songId == null) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    void getCoverUrl(songId).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [songId]);
  return url;
}

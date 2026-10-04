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
import { toSongMeta } from "@/lib/catalog";
import { mimeFromFile } from "@/lib/mime";
import {
  addSongRecord,
  createPlaylistRecord,
  deletePlaylistRecord,
  deleteSongRecord,
  evictCoverUrl,
  evictSongUrls,
  getCoverUrl,
  listPlaylistRecords,
  listSongRecords,
  patchSongRecord,
  putPlaylistRecord,
  type PlaylistRecord,
} from "@/lib/localdb";

export interface NewSongInput {
  file: File;
  title: string;
  artist: string;
  album: string;
  duration: number;
  cover: Blob | null;
  lyrics?: string | null;
}

interface LibraryState {
  ready: boolean;
  songs: Song[];
  playlists: PlaylistSummary[];
  coverRev: Record<number, number>;
  saveSong: (input: NewSongInput) => Promise<number>;
  updateSong: (
    id: number,
    patch: Partial<Pick<Song, "title" | "artist" | "album" | "liked" | "lyrics">>,
  ) => Promise<void>;
  setCover: (id: number, cover: Blob | null) => Promise<void>;
  toggleLike: (id: number) => Promise<void>;
  markPlayed: (id: number) => Promise<void>;
  findDuplicate: (file: File) => Song | undefined;
  removeSong: (id: number) => Promise<void>;
  createPlaylist: (name: string) => Promise<number>;
  removePlaylist: (id: number) => Promise<void>;
  addToPlaylist: (playlistId: number, songId: number) => Promise<void>;
  removeFromPlaylist: (playlistId: number, songId: number) => Promise<void>;
  reorderPlaylist: (playlistId: number, from: number, to: number) => Promise<void>;
  playlistSongs: (playlistId: number) => Song[];
  reload: () => Promise<void>;
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
  const [coverRev, setCoverRev] = useState<Record<number, number>>({});

  const reload = useCallback(async () => {
    const [s, p] = await Promise.all([listSongRecords(), listPlaylistRecords()]);
    const sorted = [...s].sort((a, b) => b.createdAt - a.createdAt);
    setSongs(sorted.map(toSongMeta));
    setPlaylistRecords(p);
    setReady(true);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveSong = useCallback(async (input: NewSongInput): Promise<number> => {
    const rec = {
      title: input.title,
      artist: input.artist,
      album: input.album,
      duration: input.duration,
      size: input.file.size,
      fileName: input.file.name,
      createdAt: Date.now(),
      liked: false,
      lyrics: input.lyrics ?? null,
      lastPlayedAt: 0,
      playCount: 0,
      audio: input.file.slice(0, input.file.size, mimeFromFile(input.file)),
      cover: input.cover,
      mime: mimeFromFile(input.file),
    };
    const id = await addSongRecord(rec);
    setSongs((prev) => [toSongMeta({ ...rec, id }), ...prev]);
    return id;
  }, []);

  const updateSong = useCallback(
    async (
      id: number,
      patch: Partial<Pick<Song, "title" | "artist" | "album" | "liked" | "lyrics">>,
    ) => {
      await patchSongRecord(id, patch);
      setSongs((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    },
    [],
  );

  const setCover = useCallback(async (id: number, cover: Blob | null) => {
    await patchSongRecord(id, { cover });
    evictCoverUrl(id);
    setCoverRev((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }, []);

  const toggleLike = useCallback(async (id: number) => {
    const current = songs.find((s) => s.id === id);
    if (!current) return;
    const liked = !current.liked;
    await patchSongRecord(id, { liked });
    setSongs((prev) => prev.map((s) => (s.id === id ? { ...s, liked } : s)));
  }, [songs]);

  const markPlayed = useCallback(async (id: number) => {
    const current = songs.find((s) => s.id === id);
    const playCount = (current?.playCount ?? 0) + 1;
    const lastPlayedAt = Date.now();
    await patchSongRecord(id, { playCount, lastPlayedAt });
    setSongs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, playCount, lastPlayedAt } : s)),
    );
  }, [songs]);

  const findDuplicate = useCallback(
    (file: File) =>
      songs.find((s) => s.fileName === file.name && s.size === file.size),
    [songs],
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

  const reorderPlaylist = useCallback(
    async (playlistId: number, from: number, to: number) => {
      const rec = playlistRecords.find((p) => p.id === playlistId);
      if (!rec) return;
      if (from < 0 || to < 0 || from >= rec.songIds.length || to >= rec.songIds.length) return;
      const songIds = [...rec.songIds];
      const [moved] = songIds.splice(from, 1);
      songIds.splice(to, 0, moved);
      const next = { ...rec, songIds };
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
      coverRev,
      saveSong,
      updateSong,
      setCover,
      toggleLike,
      markPlayed,
      findDuplicate,
      removeSong,
      createPlaylist,
      removePlaylist,
      addToPlaylist,
      removeFromPlaylist,
      reorderPlaylist,
      playlistSongs,
      reload,
    }),
    [
      ready, songs, playlists, coverRev, saveSong, updateSong, setCover, toggleLike,
      markPlayed, findDuplicate, removeSong, createPlaylist, removePlaylist,
      addToPlaylist, removeFromPlaylist, reorderPlaylist, playlistSongs, reload,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used within LibraryProvider");
  return ctx;
}

export function useCoverUrl(songId: number | null | undefined): string | null {
  const { coverRev } = useLibrary();
  const rev = songId != null ? coverRev[songId] ?? 0 : 0;
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
  }, [songId, rev]);
  return url;
}

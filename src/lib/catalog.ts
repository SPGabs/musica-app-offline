import type { Song } from "./types";

export interface AlbumGroup {
  album: string;
  artist: string;
  coverSongId: number | null;
  songs: Song[];
}

export interface ArtistGroup {
  artist: string;
  coverSongId: number | null;
  songs: Song[];
  albumCount: number;
}

export function albumHref(artist: string, album: string): string {
  const q = new URLSearchParams({ artist, album });
  return `/album?${q.toString()}`;
}

export function artistHref(artist: string): string {
  const q = new URLSearchParams({ name: artist });
  return `/artist?${q.toString()}`;
}

export function groupAlbums(songs: Song[]): AlbumGroup[] {
  const map = new Map<string, AlbumGroup>();
  for (const s of songs) {
    const album = s.album || "Álbum desconhecido";
    const artist = s.artist || "Artista desconhecido";
    const key = `${album}::${artist}`;
    const g = map.get(key);
    if (g) g.songs.push(s);
    else {
      map.set(key, { album, artist, coverSongId: s.id, songs: [s] });
    }
  }
  return [...map.values()].sort((a, b) => a.album.localeCompare(b.album, "pt-BR"));
}

export function groupArtists(songs: Song[]): ArtistGroup[] {
  const map = new Map<string, Song[]>();
  for (const s of songs) {
    const artist = s.artist || "Artista desconhecido";
    const list = map.get(artist);
    if (list) list.push(s);
    else map.set(artist, [s]);
  }
  return [...map.entries()]
    .map(([artist, list]) => ({
      artist,
      coverSongId: list[0]?.id ?? null,
      songs: list,
      albumCount: new Set(list.map((s) => s.album || "Álbum desconhecido")).size,
    }))
    .sort((a, b) => a.artist.localeCompare(b.artist, "pt-BR"));
}

export function toSongMeta(r: {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: number;
  size: number;
  fileName: string;
  createdAt: number;
  liked?: boolean;
  lyrics?: string | null;
  lastPlayedAt?: number;
  playCount?: number;
}): Song {
  return {
    id: r.id,
    title: r.title,
    artist: r.artist,
    album: r.album,
    duration: r.duration,
    size: r.size,
    fileName: r.fileName,
    createdAt: r.createdAt,
    liked: !!r.liked,
    lyrics: r.lyrics ?? null,
    lastPlayedAt: r.lastPlayedAt ?? 0,
    playCount: r.playCount ?? 0,
  };
}

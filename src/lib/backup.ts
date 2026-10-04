import {
  addSongRecord,
  createPlaylistRecord,
  listPlaylistRecords,
  listSongRecords,
  putPlaylistRecord,
  type PlaylistRecord,
  type SongRecord,
} from "./localdb";

const MANIFEST = "manifest.json";

interface BackupManifest {
  version: 1;
  exportedAt: number;
  songs: Array<Omit<SongRecord, "audio" | "cover">>;
  playlists: PlaylistRecord[];
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function exportLibraryBackup(): Promise<void> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const songs = await listSongRecords();
  const playlists = await listPlaylistRecords();
  const manifest: BackupManifest = {
    version: 1,
    exportedAt: Date.now(),
    songs: songs.map(({ audio: _a, cover: _c, ...meta }) => meta),
    playlists,
  };
  zip.file(MANIFEST, JSON.stringify(manifest));
  for (const s of songs) {
    zip.file(`songs/${s.id}.audio`, s.audio);
    if (s.cover) zip.file(`songs/${s.id}.cover`, s.cover);
  }
  const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `musica-backup-${stamp}.zip`);
}

export async function importLibraryBackup(file: File): Promise<{ songs: number; playlists: number }> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(file);
  const raw = zip.file(MANIFEST);
  if (!raw) throw new Error("Ficheiro de cópia inválido (falta manifest.json)");
  const manifest = JSON.parse(await raw.async("string")) as BackupManifest;
  if (manifest.version !== 1 || !Array.isArray(manifest.songs)) {
    throw new Error("Cópia de segurança não reconhecida");
  }

  const idMap = new Map<number, number>();
  let songs = 0;
  for (const meta of manifest.songs) {
    const audioFile = zip.file(`songs/${meta.id}.audio`);
    if (!audioFile) continue;
    const audio = await audioFile.async("blob");
    const coverFile = zip.file(`songs/${meta.id}.cover`);
    const cover = coverFile ? await coverFile.async("blob") : null;
    const newId = await addSongRecord({
      title: meta.title,
      artist: meta.artist,
      album: meta.album,
      duration: meta.duration,
      size: meta.size,
      fileName: meta.fileName,
      createdAt: meta.createdAt,
      liked: !!meta.liked,
      lyrics: meta.lyrics ?? null,
      lastPlayedAt: meta.lastPlayedAt ?? 0,
      playCount: meta.playCount ?? 0,
      audio,
      cover,
      mime: meta.mime || "audio/mpeg",
    });
    idMap.set(meta.id, newId);
    songs += 1;
  }

  let playlists = 0;
  for (const p of manifest.playlists ?? []) {
    const songIds = p.songIds.map((id) => idMap.get(id)).filter((id): id is number => id != null);
    const id = await createPlaylistRecord(p.name);
    await putPlaylistRecord({ id, name: p.name, createdAt: p.createdAt, songIds });
    playlists += 1;
  }

  return { songs, playlists };
}

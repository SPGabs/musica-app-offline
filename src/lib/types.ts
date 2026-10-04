/** Modelos de dados da biblioteca local (sem servidor, 100% offline). */

export interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  /** duração em segundos */
  duration: number;
  /** tamanho do ficheiro em bytes */
  size: number;
  fileName: string;
  /** Date.now() no momento da importação */
  createdAt: number;
}

export interface PlaylistSummary {
  id: number;
  name: string;
  createdAt: number;
  count: number;
  /** primeira música da playlist, usada como capa */
  coverSongId: number | null;
}

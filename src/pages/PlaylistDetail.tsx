import { useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronLeft, Play, Shuffle, X } from "lucide-react";
import { useLibrary } from "@/providers/library";
import { usePlayer } from "@/providers/player";
import { CoverArt } from "@/components/CoverArt";
import { SongActions } from "@/components/SongActions";
import { formatTime } from "@/lib/audio";
import { cn } from "@/lib/utils";

export default function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  const playlistId = Number(id);
  const navigate = useNavigate();
  const { playlists, playlistSongs, removeFromPlaylist } = useLibrary();
  const { playQueue, current, toggle } = usePlayer();

  const playlist = useMemo(
    () => playlists.find((p) => p.id === playlistId),
    [playlists, playlistId],
  );
  const songs = useMemo(
    () => (Number.isFinite(playlistId) ? playlistSongs(playlistId) : []),
    [playlistSongs, playlistId],
  );

  if (!playlist) {
    return <div className="p-8 text-center text-neutral-500">Playlist não encontrada.</div>;
  }

  const shuffleAll = () => {
    if (!songs.length) return;
    playQueue([...songs].sort(() => Math.random() - 0.5), 0);
  };

  return (
    <div className="pb-6">
      <div className="px-4 pt-4 pt-safe lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/playlists")}
          className="flex h-11 items-center gap-1 text-brand -ml-2"
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="text-[15px]">Playlists</span>
        </button>
      </div>

      <div className="flex flex-col items-center gap-4 px-8 pb-6 pt-2 text-center">
        <CoverArt
          songId={playlist.coverSongId}
          rounded="rounded-2xl"
          className="h-44 w-44 shadow-xl"
        />
        <div>
          <h1 className="text-2xl font-bold">{playlist.name}</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {songs.length} {songs.length === 1 ? "música" : "músicas"}
          </p>
        </div>
        {songs.length > 0 && (
          <div className="flex w-full max-w-xs items-center gap-3">
            <button
              onClick={() => playQueue(songs, 0)}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-black/5 text-[15px] font-medium text-brand dark:bg-white/10"
            >
              <Play className="h-5 w-5 fill-current" /> Ouvir
            </button>
            <button
              onClick={shuffleAll}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-black/5 text-[15px] font-medium text-brand dark:bg-white/10"
            >
              <Shuffle className="h-5 w-5" /> Aleatório
            </button>
          </div>
        )}
      </div>

      {songs.length === 0 ? (
        <p className="px-8 py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Playlist vazia. Use o menu ⋯ de uma música para adicioná-la aqui.
        </p>
      ) : (
        <ul className="divide-y divide-black/5 dark:divide-white/10">
          {songs.map((song, i) => {
            const isCurrent = current?.id === song.id;
            return (
              <li
                key={`${song.id}-${i}`}
                role="button"
                tabIndex={0}
                onClick={() => (isCurrent ? toggle() : playQueue(songs, i))}
                className="flex min-h-[56px] cursor-pointer items-center gap-3 px-4 py-2 active:bg-black/5 dark:active:bg-white/10 lg:px-6"
              >
                <CoverArt songId={song.id} className="h-11 w-11" rounded="rounded-md" />
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-[15px]", isCurrent && "text-brand font-medium")}>
                    {song.title}
                  </p>
                  <p className="truncate text-[13px] text-neutral-500 dark:text-neutral-400">
                    {song.artist}
                  </p>
                </div>
                <span className="text-[13px] tabular-nums text-neutral-400">
                  {song.duration ? formatTime(song.duration) : ""}
                </span>
                <button
                  aria-label="Remover da playlist"
                  className="flex h-11 w-8 items-center justify-center text-neutral-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    void removeFromPlaylist(playlistId, song.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
                <SongActions song={song} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

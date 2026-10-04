import { useMemo } from "react";
import { Play } from "lucide-react";
import type { Song } from "@/lib/types";
import { useLibrary } from "@/providers/library";
import { usePlayer } from "@/providers/player";
import { PageHeader } from "@/components/PageHeader";
import { CoverArt } from "@/components/CoverArt";

interface AlbumGroup {
  album: string;
  artist: string;
  coverSongId: number | null;
  songs: Song[];
}

export default function Albums() {
  const { songs } = useLibrary();
  const { playQueue } = usePlayer();

  const albums = useMemo<AlbumGroup[]>(() => {
    const map = new Map<string, AlbumGroup>();
    for (const s of songs) {
      const key = `${s.album ?? ""}::${s.artist ?? ""}`;
      const g = map.get(key);
      if (g) {
        g.songs.push(s);
      } else {
        map.set(key, {
          album: s.album ?? "Álbum desconhecido",
          artist: s.artist ?? "Artista desconhecido",
          coverSongId: s.id,
          songs: [s],
        });
      }
    }
    return [...map.values()].sort((a, b) => a.album.localeCompare(b.album, "pt-BR"));
  }, [songs]);

  return (
    <div className="pb-6">
      <PageHeader
        title="Álbuns"
        subtitle={albums.length ? `${albums.length} ${albums.length === 1 ? "álbum" : "álbuns"}` : undefined}
      />
      {albums.length === 0 ? (
        <p className="px-8 py-20 text-center text-neutral-500 dark:text-neutral-400">
          Nenhum álbum ainda. Adicione músicas para começar.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 px-4 pt-3 sm:grid-cols-3 lg:grid-cols-4 lg:px-8 xl:grid-cols-5">
          {albums.map((a) => (
            <div key={`${a.album}-${a.artist}`} className="group relative">
              <CoverArt
                songId={a.coverSongId}
                rounded="rounded-xl"
                className="aspect-square w-full shadow-md"
              />
              <button
                aria-label={`Ouvir ${a.album}`}
                onClick={() => playQueue(a.songs, 0)}
                className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white opacity-100 backdrop-blur transition-opacity lg:opacity-0 lg:group-hover:opacity-100"
              >
                <Play className="h-5 w-5 fill-current translate-x-px" />
              </button>
              <p className="mt-1.5 truncate text-[14px] font-medium">{a.album}</p>
              <p className="truncate text-[13px] text-neutral-500 dark:text-neutral-400">
                {a.artist}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

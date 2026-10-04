import { useMemo } from "react";
import { Link } from "react-router";
import { Play } from "lucide-react";
import { useLibrary } from "@/providers/library";
import { usePlayer } from "@/providers/player";
import { PageHeader } from "@/components/PageHeader";
import { CoverArt } from "@/components/CoverArt";
import { albumHref, groupAlbums } from "@/lib/catalog";

export default function Albums() {
  const { songs } = useLibrary();
  const { playQueue } = usePlayer();
  const albums = useMemo(() => groupAlbums(songs), [songs]);

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
              <Link to={albumHref(a.artist, a.album)} className="press block">
                <CoverArt
                  songId={a.coverSongId}
                  rounded="rounded-xl"
                  className="aspect-square w-full shadow-md"
                />
              </Link>
              <button
                type="button"
                aria-label={`Ouvir ${a.album}`}
                onClick={() => playQueue(a.songs, 0)}
                className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white opacity-100 backdrop-blur transition-opacity lg:opacity-0 lg:group-hover:opacity-100"
              >
                <Play className="h-5 w-5 fill-current translate-x-px" />
              </button>
              <Link to={albumHref(a.artist, a.album)}>
                <p className="mt-1.5 truncate text-[14px] font-medium">{a.album}</p>
              </Link>
              <Link to={`/artist?name=${encodeURIComponent(a.artist)}`}>
                <p className="truncate text-[13px] text-neutral-500 dark:text-neutral-400">
                  {a.artist}
                </p>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

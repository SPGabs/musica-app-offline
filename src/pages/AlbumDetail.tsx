import { useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ChevronLeft, Play, Shuffle } from "lucide-react";
import { useLibrary } from "@/providers/library";
import { usePlayer } from "@/providers/player";
import { CoverArt } from "@/components/CoverArt";
import { SongList } from "@/components/SongList";
import { artistHref, groupAlbums } from "@/lib/catalog";

export default function AlbumDetail() {
  const [params] = useSearchParams();
  const artist = params.get("artist") ?? "";
  const album = params.get("album") ?? "";
  const navigate = useNavigate();
  const { songs } = useLibrary();
  const { playQueue } = usePlayer();

  const group = useMemo(
    () => groupAlbums(songs).find((a) => a.artist === artist && a.album === album),
    [songs, artist, album],
  );

  if (!group) {
    return <div className="p-8 text-center text-neutral-500">Álbum não encontrado.</div>;
  }

  return (
    <div className="pb-6">
      <div className="px-4 pt-4 pt-safe lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/albums")}
          className="flex h-11 items-center gap-1 text-brand -ml-2"
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="text-[15px]">Álbuns</span>
        </button>
      </div>
      <div className="flex flex-col items-center gap-4 px-8 pb-6 pt-2 text-center">
        <CoverArt songId={group.coverSongId} rounded="rounded-2xl" className="h-44 w-44 shadow-xl" />
        <div>
          <h1 className="text-2xl font-bold">{group.album}</h1>
          <Link to={artistHref(group.artist)} className="text-sm text-brand">
            {group.artist}
          </Link>
          <p className="text-sm text-neutral-500">
            {group.songs.length} {group.songs.length === 1 ? "música" : "músicas"}
          </p>
        </div>
        <div className="flex w-full max-w-xs items-center gap-3">
          <button
            type="button"
            onClick={() => playQueue(group.songs, 0)}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-black/5 text-[15px] font-medium text-brand dark:bg-white/10"
          >
            <Play className="h-5 w-5 fill-current" /> Ouvir
          </button>
          <button
            type="button"
            onClick={() => playQueue([...group.songs].sort(() => Math.random() - 0.5), 0)}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-black/5 text-[15px] font-medium text-brand dark:bg-white/10"
          >
            <Shuffle className="h-5 w-5" /> Aleatório
          </button>
        </div>
      </div>
      <SongList songs={group.songs} showAlbum={false} />
    </div>
  );
}

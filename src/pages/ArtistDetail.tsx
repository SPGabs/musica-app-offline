import { useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ChevronLeft, Play, Shuffle } from "lucide-react";
import { useLibrary } from "@/providers/library";
import { usePlayer } from "@/providers/player";
import { CoverArt } from "@/components/CoverArt";
import { SongList } from "@/components/SongList";
import { PageHeader } from "@/components/PageHeader";
import { albumHref, artistHref, groupAlbums, groupArtists } from "@/lib/catalog";

export default function ArtistDetail() {
  const [params] = useSearchParams();
  const name = params.get("name");
  const navigate = useNavigate();
  const { songs } = useLibrary();
  const { playQueue } = usePlayer();

  const artists = useMemo(() => groupArtists(songs), [songs]);
  const albums = useMemo(
    () => (name ? groupAlbums(songs).filter((a) => a.artist === name) : []),
    [songs, name],
  );
  const group = name ? artists.find((a) => a.artist === name) : undefined;

  if (!name) {
    return (
      <div className="pb-6">
        <PageHeader
          title="Artistas"
          subtitle={`${artists.length} ${artists.length === 1 ? "artista" : "artistas"}`}
        />
        {artists.length === 0 ? (
          <p className="px-8 py-20 text-center text-neutral-500">Nenhum artista ainda.</p>
        ) : (
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {artists.map((a) => (
              <li key={a.artist}>
                <Link to={artistHref(a.artist)} className="flex items-center gap-3 px-4 py-3 lg:px-8">
                  <CoverArt songId={a.coverSongId} className="h-14 w-14" rounded="rounded-full" />
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium">{a.artist}</p>
                    <p className="text-[13px] text-neutral-500">
                      {a.albumCount} {a.albumCount === 1 ? "álbum" : "álbuns"} · {a.songs.length}{" "}
                      {a.songs.length === 1 ? "música" : "músicas"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (!group) {
    return <div className="p-8 text-center text-neutral-500">Artista não encontrado.</div>;
  }

  return (
    <div className="pb-6">
      <div className="px-4 pt-4 pt-safe lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/artist")}
          className="flex h-11 items-center gap-1 text-brand -ml-2"
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="text-[15px]">Artistas</span>
        </button>
      </div>
      <div className="flex flex-col items-center gap-4 px-8 pb-6 pt-2 text-center">
        <CoverArt songId={group.coverSongId} rounded="rounded-full" className="h-36 w-36 shadow-xl" />
        <div>
          <h1 className="text-2xl font-bold">{group.artist}</h1>
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
      {albums.length > 0 && (
        <section className="px-4 pb-4 lg:px-8">
          <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-neutral-500">
            Álbuns
          </h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {albums.map((a) => (
              <Link key={a.album} to={albumHref(a.artist, a.album)} className="w-28 shrink-0">
                <CoverArt songId={a.coverSongId} rounded="rounded-xl" className="aspect-square w-full" />
                <p className="mt-1 truncate text-[13px] font-medium">{a.album}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
      <h2 className="px-4 pb-2 text-[13px] font-semibold uppercase tracking-wide text-neutral-500 lg:px-8">
        Músicas
      </h2>
      <SongList songs={group.songs} />
    </div>
  );
}

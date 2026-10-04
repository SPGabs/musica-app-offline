import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Search as SearchIcon } from "lucide-react";
import { useLibrary } from "@/providers/library";
import { PageHeader } from "@/components/PageHeader";
import { SongList } from "@/components/SongList";
import { CoverArt } from "@/components/CoverArt";
import { albumHref, artistHref, groupAlbums, groupArtists } from "@/lib/catalog";

export default function Search() {
  const { songs } = useLibrary();
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();

  const songHits = useMemo(() => {
    if (!q) return [];
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.artist ?? "").toLowerCase().includes(q) ||
        (s.album ?? "").toLowerCase().includes(q),
    );
  }, [songs, q]);

  const artistHits = useMemo(() => {
    if (!q) return [];
    return groupArtists(songs).filter((a) => a.artist.toLowerCase().includes(q));
  }, [songs, q]);

  const albumHits = useMemo(() => {
    if (!q) return [];
    return groupAlbums(songs).filter(
      (a) => a.album.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q),
    );
  }, [songs, q]);

  return (
    <div className="pb-6">
      <PageHeader title="Buscar" />
      <div className="px-4 py-3 lg:px-8">
        <div className="flex h-11 items-center gap-2 rounded-xl bg-black/5 px-3 dark:bg-white/10">
          <SearchIcon className="h-5 w-5 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Músicas, artistas e álbuns"
            className="h-full w-full bg-transparent text-[15px] outline-none placeholder:text-neutral-400"
          />
        </div>
      </div>

      {q === "" ? (
        <p className="px-8 py-16 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Digite para buscar na sua biblioteca.
        </p>
      ) : songHits.length === 0 && artistHits.length === 0 && albumHits.length === 0 ? (
        <p className="px-8 py-16 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Nenhum resultado para “{query}”.
        </p>
      ) : (
        <div className="space-y-6">
          {artistHits.length > 0 && (
            <section>
              <h2 className="px-4 pb-2 text-[13px] font-semibold uppercase tracking-wide text-neutral-500 lg:px-8">
                Artistas
              </h2>
              <ul>
                {artistHits.slice(0, 8).map((a) => (
                  <li key={a.artist}>
                    <Link
                      to={artistHref(a.artist)}
                      className="flex items-center gap-3 px-4 py-2 lg:px-8"
                    >
                      <CoverArt songId={a.coverSongId} className="h-12 w-12" rounded="rounded-full" />
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-medium">{a.artist}</p>
                        <p className="text-[13px] text-neutral-500">
                          {a.songs.length} {a.songs.length === 1 ? "música" : "músicas"}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {albumHits.length > 0 && (
            <section>
              <h2 className="px-4 pb-2 text-[13px] font-semibold uppercase tracking-wide text-neutral-500 lg:px-8">
                Álbuns
              </h2>
              <ul>
                {albumHits.slice(0, 8).map((a) => (
                  <li key={`${a.album}-${a.artist}`}>
                    <Link
                      to={albumHref(a.artist, a.album)}
                      className="flex items-center gap-3 px-4 py-2 lg:px-8"
                    >
                      <CoverArt songId={a.coverSongId} className="h-12 w-12" rounded="rounded-lg" />
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-medium">{a.album}</p>
                        <p className="truncate text-[13px] text-neutral-500">{a.artist}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {songHits.length > 0 && (
            <section>
              <h2 className="px-4 pb-2 text-[13px] font-semibold uppercase tracking-wide text-neutral-500 lg:px-8">
                Músicas
              </h2>
              <SongList songs={songHits} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

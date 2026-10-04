import { useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { useLibrary } from "@/providers/library";
import { PageHeader } from "@/components/PageHeader";
import { SongList } from "@/components/SongList";

export default function Search() {
  const { songs } = useLibrary();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.artist ?? "").toLowerCase().includes(q) ||
        (s.album ?? "").toLowerCase().includes(q),
    );
  }, [songs, query]);

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

      {query.trim() === "" ? (
        <p className="px-8 py-16 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Digite para buscar na sua biblioteca.
        </p>
      ) : results.length === 0 ? (
        <p className="px-8 py-16 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Nenhum resultado para “{query}”.
        </p>
      ) : (
        <SongList songs={results} />
      )}
    </div>
  );
}

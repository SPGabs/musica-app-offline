import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Play, Plus, Shuffle } from "lucide-react";
import { useLibrary } from "@/providers/library";
import { usePlayer } from "@/providers/player";
import { PageHeader } from "@/components/PageHeader";
import { SongList } from "@/components/SongList";
import { cn } from "@/lib/utils";

type Sort = "recent" | "title" | "artist";

const sorts: { id: Sort; label: string }[] = [
  { id: "recent", label: "Recentes" },
  { id: "title", label: "Título" },
  { id: "artist", label: "Artista" },
];

export default function Library() {
  const { songs } = useLibrary();
  const { playQueue } = usePlayer();
  const [sort, setSort] = useState<Sort>("recent");

  const sorted = useMemo(() => {
    const arr = [...songs];
    if (sort === "title") arr.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
    else if (sort === "artist")
      arr.sort(
        (a, b) =>
          (a.artist ?? "").localeCompare(b.artist ?? "", "pt-BR") ||
          a.title.localeCompare(b.title, "pt-BR"),
      );
    return arr; // "recent" mantém ordem por data de importação (desc)
  }, [songs, sort]);

  const shuffleAll = () => {
    if (!sorted.length) return;
    const shuffled = [...sorted].sort(() => Math.random() - 0.5);
    playQueue(shuffled, 0);
  };

  return (
    <div className="pb-6">
      <PageHeader
        title="Músicas"
        subtitle={`${songs.length} ${songs.length === 1 ? "música" : "músicas"}`}
        actions={
          <Link
            to="/upload"
            aria-label="Adicionar músicas"
            className="mb-1 flex h-11 w-11 items-center justify-center rounded-full text-brand active:bg-black/5 dark:active:bg-white/10"
          >
            <Plus className="h-7 w-7" />
          </Link>
        }
      />

      {sorted.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 lg:px-8">
          <button
            onClick={() => playQueue(sorted, 0)}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-black/5 text-[15px] font-medium text-brand dark:bg-white/10 lg:max-w-52"
          >
            <Play className="h-5 w-5 fill-current" /> Ouvir
          </button>
          <button
            onClick={shuffleAll}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-black/5 text-[15px] font-medium text-brand dark:bg-white/10 lg:max-w-52"
          >
            <Shuffle className="h-5 w-5" /> Aleatório
          </button>
        </div>
      )}

      <div className="flex gap-2 px-4 pb-2 lg:px-8">
        {sorts.map((s) => (
          <button
            key={s.id}
            onClick={() => setSort(s.id)}
            className={cn(
              "h-9 rounded-full px-4 text-sm font-medium transition-colors",
              sort === s.id
                ? "bg-brand text-white"
                : "bg-black/5 text-neutral-600 dark:bg-white/10 dark:text-neutral-300",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-4 px-8 py-20 text-center">
          <p className="text-lg font-medium">A sua biblioteca está vazia</p>
          <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
            Adicione as músicas que tem guardadas na app Ficheiros do iPhone/iPad. Tudo fica no
            dispositivo — sem conta, sem internet, sem envio de dados.
          </p>
          <Link
            to="/upload"
            className="mt-2 flex h-11 items-center gap-2 rounded-full bg-brand px-6 text-[15px] font-medium text-white"
          >
            <Plus className="h-5 w-5" /> Adicionar músicas
          </Link>
        </div>
      ) : (
        <SongList songs={sorted} />
      )}
    </div>
  );
}

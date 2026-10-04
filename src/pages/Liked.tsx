import { useMemo } from "react";
import { Heart, Play, Shuffle } from "lucide-react";
import { useLibrary } from "@/providers/library";
import { usePlayer } from "@/providers/player";
import { PageHeader } from "@/components/PageHeader";
import { SongList } from "@/components/SongList";

export default function Liked() {
  const { songs } = useLibrary();
  const { playQueue } = usePlayer();
  const liked = useMemo(() => songs.filter((s) => s.liked), [songs]);

  return (
    <div className="pb-6">
      <PageHeader
        title="Gostos"
        subtitle={`${liked.length} ${liked.length === 1 ? "música" : "músicas"}`}
      />
      {liked.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-8 py-20 text-center">
          <Heart className="h-12 w-12 text-neutral-300 dark:text-neutral-600" />
          <p className="text-sm text-neutral-500">Toque no coração para guardar as suas músicas.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 px-4 py-3 lg:px-8">
            <button
              type="button"
              onClick={() => playQueue(liked, 0)}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-black/5 text-[15px] font-medium text-brand dark:bg-white/10 lg:max-w-52"
            >
              <Play className="h-5 w-5 fill-current" /> Ouvir
            </button>
            <button
              type="button"
              onClick={() => playQueue([...liked].sort(() => Math.random() - 0.5), 0)}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-black/5 text-[15px] font-medium text-brand dark:bg-white/10 lg:max-w-52"
            >
              <Shuffle className="h-5 w-5" /> Aleatório
            </button>
          </div>
          <SongList songs={liked} />
        </>
      )}
    </div>
  );
}

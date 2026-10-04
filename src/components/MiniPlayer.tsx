import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { usePlayer } from "@/providers/player";
import { CoverArt } from "./CoverArt";

export function MiniPlayer() {
  const { current, isPlaying, toggle, prev, next, setNowPlayingOpen } = usePlayer();
  if (!current) return null;

  return (
    <div className="px-2 pb-1">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setNowPlayingOpen(true)}
        onKeyDown={(e) => e.key === "Enter" && setNowPlayingOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-white/85 dark:bg-neutral-800/85 backdrop-blur-xl shadow-lg border border-black/5 dark:border-white/10 px-2 h-14 cursor-pointer active:scale-[0.99] transition-transform"
      >
        <CoverArt songId={current.id} className="h-10 w-10" rounded="rounded-md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium leading-tight">{current.title}</p>
          <p className="truncate text-[13px] text-neutral-500 dark:text-neutral-400 leading-tight">
            {current.artist}
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          aria-label="Anterior"
          className="flex h-11 w-9 items-center justify-center rounded-full text-foreground"
        >
          <SkipBack className="h-5 w-5 fill-current" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
          aria-label={isPlaying ? "Pausar" : "Tocar"}
          className="flex h-11 w-11 items-center justify-center rounded-full text-foreground active:bg-black/5 dark:active:bg-white/10"
        >
          {isPlaying ? <Pause className="h-7 w-7 fill-current" /> : <Play className="h-7 w-7 fill-current" />}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            next(false);
          }}
          aria-label="Próxima"
          className="flex h-11 w-9 items-center justify-center rounded-full text-foreground"
        >
          <SkipForward className="h-5 w-5 fill-current" />
        </button>
      </div>
    </div>
  );
}

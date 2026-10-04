import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { usePlayer } from "@/providers/player";
import { haptic } from "@/lib/haptics";
import { CoverArt } from "./CoverArt";
import { PlayingBars } from "./PlayingBars";
import { useRef } from "react";

export function MiniPlayer() {
  const { current, isPlaying, toggle, prev, next, setNowPlayingOpen } = usePlayer();
  const start = useRef<{ x: number; y: number; axis: "x" | "y" | null } | null>(null);
  const swiped = useRef(false);
  if (!current) return null;

  return (
    <div className="px-2 pb-1">
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (swiped.current) {
            swiped.current = false;
            return;
          }
          setNowPlayingOpen(true);
        }}
        onKeyDown={(e) => e.key === "Enter" && setNowPlayingOpen(true)}
        onPointerDown={(e) => {
          start.current = { x: e.clientX, y: e.clientY, axis: null };
        }}
        onPointerMove={(e) => {
          const s = start.current;
          if (!s || s.axis) return;
          const dx = e.clientX - s.x;
          const dy = e.clientY - s.y;
          if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
          s.axis = Math.abs(dy) > Math.abs(dx) ? "y" : "x";
        }}
        onPointerUp={(e) => {
          const s = start.current;
          start.current = null;
          if (!s) return;
          const dx = e.clientX - s.x;
          const dy = e.clientY - s.y;
          if (s.axis === "y" && dy < -36) {
            swiped.current = true;
            void haptic("light");
            setNowPlayingOpen(true);
            return;
          }
          if (s.axis === "x" && Math.abs(dx) > 48) {
            swiped.current = true;
            void haptic("medium");
            if (dx < 0) next(false);
            else prev();
          }
        }}
        className="press flex h-14 cursor-pointer items-center gap-2 rounded-xl border border-black/5 bg-white/85 px-2 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-neutral-800/85"
      >
        <div className="relative">
          <CoverArt songId={current.id} className="h-10 w-10" rounded="rounded-md" />
          {isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/35">
              <PlayingBars playing className="eq-sm" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium leading-tight">{current.title}</p>
          <p className="truncate text-[13px] leading-tight text-neutral-500 dark:text-neutral-400">
            {current.artist}
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void haptic("medium");
            prev();
          }}
          aria-label="Anterior"
          className="press flex h-11 w-9 items-center justify-center rounded-full text-foreground"
        >
          <SkipBack className="h-5 w-5 fill-current" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void haptic("light");
            toggle();
          }}
          aria-label={isPlaying ? "Pausar" : "Tocar"}
          className="press flex h-11 w-11 items-center justify-center rounded-full text-foreground"
        >
          {isPlaying ? <Pause className="h-7 w-7 fill-current" /> : <Play className="h-7 w-7 fill-current" />}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void haptic("medium");
            next(false);
          }}
          aria-label="Próxima"
          className="press flex h-11 w-9 items-center justify-center rounded-full text-foreground"
        >
          <SkipForward className="h-5 w-5 fill-current" />
        </button>
      </div>
    </div>
  );
}

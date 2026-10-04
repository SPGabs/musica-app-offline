import {
  ChevronDown,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { usePlayer } from "@/providers/player";
import { useCoverUrl } from "@/providers/library";
import { CoverArt } from "./CoverArt";
import { formatTime } from "@/lib/audio";
import { cn } from "@/lib/utils";

function Slider({
  value,
  max,
  onChange,
  className,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  const fill = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <input
      type="range"
      min={0}
      max={max || 1}
      step={0.1}
      value={Math.min(value, max || 1)}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn("ios-slider", className)}
      style={{ "--fill": `${fill}%` } as React.CSSProperties}
    />
  );
}

export function NowPlaying() {
  const {
    current,
    isPlaying,
    progress,
    duration,
    toggle,
    next,
    prev,
    seek,
    shuffle,
    repeat,
    volume,
    setVolume,
    toggleShuffle,
    cycleRepeat,
    nowPlayingOpen,
    setNowPlayingOpen,
  } = usePlayer();
  const coverUrl = useCoverUrl(current?.id);

  if (!nowPlayingOpen || !current) return null;

  const dur = duration || current.duration || 0;

  return (
    <div className="fixed inset-0 z-50 sheet-up">
      {/* blurred cover backdrop */}
      <div className="absolute inset-0 bg-neutral-100 dark:bg-neutral-950" />
      {coverUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 dark:opacity-30 blur-3xl scale-125"
          style={{ backgroundImage: `url(${coverUrl})` }}
        />
      )}
      <div className="absolute inset-0 bg-white/40 dark:bg-black/50" />

      <div className="relative flex h-full flex-col px-6 pt-safe pb-safe max-w-xl mx-auto w-full">
        <div className="flex items-center justify-center pt-3">
          <button
            onClick={() => setNowPlayingOpen(false)}
            aria-label="Fechar"
            className="flex h-11 w-11 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10"
          >
            <ChevronDown className="h-7 w-7" />
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center min-h-0 py-4">
          <CoverArt
            songId={current.id}
            rounded="rounded-2xl"
            className="aspect-square h-auto w-full max-w-[340px] max-h-full shadow-2xl md:max-w-[420px]"
          />
        </div>

        <div className="space-y-5 pb-4">
          <div className="text-center">
            <p className="truncate text-xl font-semibold">{current.title}</p>
            <p className="truncate text-lg text-brand">{current.artist}</p>
          </div>

          <div>
            <Slider value={progress} max={dur} onChange={seek} />
            <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 -mt-1">
              <span>{formatTime(progress)}</span>
              <span>-{formatTime(Math.max(0, dur - progress))}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-14">
            <button onClick={() => next(false)} className="order-3 flex h-14 w-14 items-center justify-center" aria-label="Próxima">
              <SkipForward className="h-9 w-9 fill-current" />
            </button>
            <button
              onClick={toggle}
              aria-label={isPlaying ? "Pausar" : "Tocar"}
              className="order-2 flex h-20 w-20 items-center justify-center rounded-full bg-foreground text-background shadow-xl active:scale-95 transition-transform"
            >
              {isPlaying ? (
                <Pause className="h-10 w-10 fill-current" />
              ) : (
                <Play className="h-10 w-10 fill-current translate-x-0.5" />
              )}
            </button>
            <button onClick={prev} className="order-1 flex h-14 w-14 items-center justify-center" aria-label="Anterior">
              <SkipBack className="h-9 w-9 fill-current" />
            </button>
          </div>

          <div className="flex items-center gap-3 px-2">
            <button
              onClick={() => setVolume(volume > 0 ? 0 : 1)}
              aria-label="Mudo"
              className="text-neutral-500 dark:text-neutral-400"
            >
              {volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <Slider value={volume} max={1} onChange={setVolume} className="volume" />
          </div>

          <div className="flex items-center justify-center gap-16 pt-1">
            <button
              onClick={toggleShuffle}
              aria-label="Aleatório"
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full",
                shuffle ? "text-brand" : "text-neutral-500 dark:text-neutral-400",
              )}
            >
              <Shuffle className="h-6 w-6" />
            </button>
            <button
              onClick={cycleRepeat}
              aria-label="Repetir"
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full",
                repeat !== "off" ? "text-brand" : "text-neutral-500 dark:text-neutral-400",
              )}
            >
              {repeat === "one" ? <Repeat1 className="h-6 w-6" /> : <Repeat className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

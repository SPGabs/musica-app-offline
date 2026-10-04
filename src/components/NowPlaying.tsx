import { useRef, useState, type TouchEvent } from "react";
import { Link } from "react-router";
import {
  ChevronDown,
  ListMusic,
  Mic2,
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
import { LikeButton } from "./LikeButton";
import { formatTime } from "@/lib/audio";
import { artistHref } from "@/lib/catalog";
import { isAppleTouchDevice } from "@/lib/device";
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
    speed,
    setVolume,
    cycleSpeed,
    toggleShuffle,
    cycleRepeat,
    nowPlayingOpen,
    setNowPlayingOpen,
    queue,
    currentIndex,
    playAt,
    queueOpen,
    setQueueOpen,
  } = usePlayer();
  const coverUrl = useCoverUrl(current?.id);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const hideVolume = isAppleTouchDevice();
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);

  if (!nowPlayingOpen || !current) return null;

  const dur = duration || current.duration || 0;

  const onTouchStart = (e: TouchEvent) => {
    const el = e.target as HTMLElement;
    if (el.closest("input, button, a, textarea")) return;
    const t = e.changedTouches[0];
    if (!t) return;
    touch.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  };
  const onTouchEnd = (e: TouchEvent) => {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Date.now() - start.t > 600) return;
    if (Math.abs(dx) < 50 && Math.abs(dy) < 50) return;
    if (Math.abs(dy) > Math.abs(dx) && dy > 80) {
      setNowPlayingOpen(false);
      return;
    }
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
      if (dx < 0) next(false);
      else prev();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 sheet-up"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="absolute inset-0 bg-neutral-100 dark:bg-neutral-950" />
      {coverUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 dark:opacity-30 blur-3xl scale-125"
          style={{ backgroundImage: `url(${coverUrl})` }}
        />
      )}
      <div className="absolute inset-0 bg-white/40 dark:bg-black/50" />

      <div className="relative flex h-full flex-col px-6 pt-safe pb-safe max-w-xl mx-auto w-full">
        <div className="flex items-center justify-between pt-3">
          <button
            type="button"
            onClick={() => setNowPlayingOpen(false)}
            aria-label="Fechar"
            className="flex h-11 w-11 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10"
          >
            <ChevronDown className="h-7 w-7" />
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Letra"
              onClick={() => {
                setLyricsOpen((v) => !v);
                setQueueOpen(false);
              }}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full",
                lyricsOpen ? "text-brand" : "text-neutral-500",
              )}
            >
              <Mic2 className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Fila"
              onClick={() => {
                setQueueOpen(!queueOpen);
                setLyricsOpen(false);
              }}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full",
                queueOpen ? "text-brand" : "text-neutral-500",
              )}
            >
              <ListMusic className="h-5 w-5" />
            </button>
          </div>
        </div>

        {queueOpen ? (
          <ul className="min-h-0 flex-1 overflow-y-auto py-2">
            {queue.map((song, i) => (
              <li key={`${song.id}-${i}`}>
                <button
                  type="button"
                  onClick={() => playAt(i)}
                  className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-left"
                >
                  <CoverArt songId={song.id} className="h-10 w-10" rounded="rounded-md" />
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-[15px]", i === currentIndex && "text-brand font-medium")}>
                      {song.title}
                    </p>
                    <p className="truncate text-[13px] text-neutral-500">{song.artist}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : lyricsOpen ? (
          <div className="min-h-0 flex-1 overflow-y-auto py-4">
            {current.lyrics ? (
              <p className="whitespace-pre-wrap text-center text-[17px] leading-relaxed">
                {current.lyrics}
              </p>
            ) : (
              <p className="px-6 py-16 text-center text-sm text-neutral-500">
                Este ficheiro não tem letra nas tags. Pode colar a letra em Editar informações.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center min-h-0 py-4">
            <CoverArt
              songId={current.id}
              rounded="rounded-2xl"
              className="aspect-square h-auto w-full max-w-[340px] max-h-full shadow-2xl md:max-w-[420px]"
            />
          </div>
        )}

        <div className="space-y-4 pb-4">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1 text-center">
              <p className="truncate text-xl font-semibold">{current.title}</p>
              <Link
                to={artistHref(current.artist)}
                onClick={() => setNowPlayingOpen(false)}
                className="truncate text-lg text-brand"
              >
                {current.artist}
              </Link>
            </div>
            <LikeButton song={current} />
          </div>

          <div>
            <Slider value={progress} max={dur} onChange={seek} />
            <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 -mt-1">
              <span>{formatTime(progress)}</span>
              <span>-{formatTime(Math.max(0, dur - progress))}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-14">
            <button type="button" onClick={() => next(false)} className="order-3 flex h-14 w-14 items-center justify-center" aria-label="Próxima">
              <SkipForward className="h-9 w-9 fill-current" />
            </button>
            <button
              type="button"
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
            <button type="button" onClick={prev} className="order-1 flex h-14 w-14 items-center justify-center" aria-label="Anterior">
              <SkipBack className="h-9 w-9 fill-current" />
            </button>
          </div>

          {!hideVolume && (
            <div className="flex items-center gap-3 px-2">
              <button
                type="button"
                onClick={() => setVolume(volume > 0 ? 0 : 1)}
                aria-label="Mudo"
                className="text-neutral-500 dark:text-neutral-400"
              >
                {volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <Slider value={volume} max={1} onChange={setVolume} className="volume" />
            </div>
          )}

          <div className="flex items-center justify-center gap-10 pt-1">
            <button
              type="button"
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
              type="button"
              onClick={cycleSpeed}
              aria-label="Velocidade"
              className="flex h-11 min-w-11 items-center justify-center rounded-full px-2 text-[13px] font-semibold tabular-nums text-neutral-500 dark:text-neutral-400"
            >
              {speed === 1 ? "1×" : `${speed}×`}
            </button>
            <button
              type="button"
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

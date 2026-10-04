import { Heart } from "lucide-react";
import type { Song } from "@/lib/types";
import { useLibrary } from "@/providers/library";
import { cn } from "@/lib/utils";

export function LikeButton({
  song,
  className,
}: {
  song: Song;
  className?: string;
}) {
  const { toggleLike } = useLibrary();
  return (
    <button
      type="button"
      aria-label={song.liked ? "Remover dos gostos" : "Gostar"}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10",
        className,
      )}
      onClick={(e) => {
        e.stopPropagation();
        void toggleLike(song.id);
      }}
    >
      <Heart
        className={cn("h-5 w-5", song.liked ? "fill-brand text-brand" : "text-neutral-400")}
      />
    </button>
  );
}

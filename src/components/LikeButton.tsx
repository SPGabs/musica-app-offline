import { Heart } from "lucide-react";
import type { Song } from "@/lib/types";
import { useLibrary } from "@/providers/library";
import { haptic } from "@/lib/haptics";
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
        "press flex h-11 w-11 items-center justify-center rounded-full",
        className,
      )}
      onClick={(e) => {
        e.stopPropagation();
        void haptic(song.liked ? "light" : "success");
        void toggleLike(song.id);
      }}
    >
      <Heart
        className={cn(
          "h-5 w-5 origin-center",
          song.liked ? "heart-pop fill-brand text-brand" : "text-neutral-400",
        )}
      />
    </button>
  );
}

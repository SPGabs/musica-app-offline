import { useState } from "react";
import { Link } from "react-router";
import { ChevronRight, ListMusic, Plus, Trash2 } from "lucide-react";
import { useLibrary } from "@/providers/library";
import { PageHeader } from "@/components/PageHeader";
import { CoverArt } from "@/components/CoverArt";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Playlists() {
  const { playlists, createPlaylist, removePlaylist } = useLibrary();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await createPlaylist(name.trim());
      setOpen(false);
      setName("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pb-6">
      <PageHeader
        title="Playlists"
        subtitle={`${playlists.length} ${playlists.length === 1 ? "playlist" : "playlists"}`}
        actions={
          <button
            aria-label="Nova playlist"
            onClick={() => setOpen(true)}
            className="mb-1 flex h-11 w-11 items-center justify-center rounded-full text-brand active:bg-black/5 dark:active:bg-white/10"
          >
            <Plus className="h-7 w-7" />
          </button>
        }
      />

      {playlists.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-8 py-20 text-center">
          <ListMusic className="h-12 w-12 text-neutral-300 dark:text-neutral-600" />
          <p className="text-lg font-medium">Nenhuma playlist</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Toque em + para criar a sua primeira playlist.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-black/5 px-2 dark:divide-white/10">
          {playlists.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-2 py-2 lg:px-4">
              <Link to={`/playlists/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-1">
                <CoverArt songId={p.coverSongId} className="h-12 w-12" rounded="rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{p.name}</p>
                  <p className="text-[13px] text-neutral-500 dark:text-neutral-400">
                    {p.count} {p.count === 1 ? "música" : "músicas"}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-neutral-300 dark:text-neutral-600" />
              </Link>
              <button
                aria-label="Apagar playlist"
                className="flex h-11 w-11 items-center justify-center rounded-full text-neutral-400 active:bg-black/5 dark:active:bg-white/10"
                onClick={() => {
                  if (window.confirm(`Apagar a playlist “${p.name}”? As músicas continuam na biblioteca.`)) {
                    void removePlaylist(p.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome da playlist"
              onKeyDown={(e) => {
                if (e.key === "Enter") void create();
              }}
            />
            <Button
              className="w-full bg-brand text-white hover:opacity-90"
              disabled={!name.trim() || busy}
              onClick={() => void create()}
            >
              {busy ? "A criar…" : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

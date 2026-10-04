import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  ChevronRight,
  Download,
  FileAudio,
  Moon,
  ShieldCheck,
  Smartphone,
  Sun,
  Upload,
} from "lucide-react";
import { useLibrary } from "@/providers/library";
import { usePlayer } from "@/providers/player";
import { usePlayerTheme, ACCENTS, type Appearance } from "@/providers/theme";
import { PageHeader } from "@/components/PageHeader";
import { formatBytes } from "@/lib/audio";
import { exportLibraryBackup, importLibraryBackup } from "@/lib/backup";
import { quotaWarning, storageEstimate, type StorageInfo } from "@/lib/quota";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const appearances: { id: Appearance; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Claro", icon: Sun },
  { id: "dark", label: "Escuro", icon: Moon },
  { id: "auto", label: "Automático", icon: Smartphone },
];

const CROSSFADES = [
  { id: 0, label: "Desligado" },
  { id: 3, label: "3 s" },
  { id: 6, label: "6 s" },
  { id: 12, label: "12 s" },
];

export default function Settings() {
  const { accent, setAccent, appearance, setAppearance } = usePlayerTheme();
  const { songs, reload } = useLibrary();
  const { crossfade, setCrossfade } = usePlayer();
  const [info, setInfo] = useState<StorageInfo | null>(null);
  const [busy, setBusy] = useState<"export" | "import" | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const totalSize = songs.reduce((sum, s) => sum + (s.size || 0), 0);
  const warning = info ? quotaWarning(info) : null;

  useEffect(() => {
    void storageEstimate().then(setInfo);
  }, [songs.length, totalSize]);

  return (
    <div className="pb-6">
      <PageHeader title="Ajustes" />

      <div className="space-y-8 px-4 pt-2 lg:max-w-2xl lg:px-8">
        {warning && (
          <p className="rounded-2xl bg-amber-500/15 px-4 py-3 text-[14px] text-amber-800 dark:text-amber-200">
            {warning}
          </p>
        )}

        <section>
          <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Biblioteca
          </h2>
          <Link
            to="/upload"
            className="flex items-center gap-3 rounded-2xl bg-black/[0.04] p-4 active:bg-black/10 dark:bg-white/10 dark:active:bg-white/15"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
              <FileAudio className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium">Adicionar músicas</p>
              <p className="text-[13px] text-neutral-500 dark:text-neutral-400">
                Escolher ficheiros locais (app Ficheiros)
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-neutral-400" />
          </Link>
          <div className="mt-3 rounded-2xl bg-black/[0.04] p-4 text-[14px] dark:bg-white/10">
            <div className="flex justify-between py-1">
              <span className="text-neutral-500 dark:text-neutral-400">Músicas</span>
              <span className="tabular-nums">{songs.length}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-neutral-500 dark:text-neutral-400">Ficheiros</span>
              <span className="tabular-nums">{formatBytes(totalSize)}</span>
            </div>
            {info && info.quota > 0 && (
              <div className="flex justify-between py-1">
                <span className="text-neutral-500 dark:text-neutral-400">Espaço Safari</span>
                <span className="tabular-nums">
                  {formatBytes(info.usage)} / {formatBytes(info.quota)}
                </span>
              </div>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy !== null || songs.length === 0}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-black/[0.04] text-[14px] font-medium disabled:opacity-50 dark:bg-white/10"
              onClick={() =>
                void (async () => {
                  setBusy("export");
                  try {
                    await exportLibraryBackup();
                    toast.success("Cópia guardada nos Descargas");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Falha ao exportar");
                  } finally {
                    setBusy(null);
                  }
                })()
              }
            >
              <Download className="h-4 w-4" />
              {busy === "export" ? "A exportar…" : "Exportar"}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-black/[0.04] text-[14px] font-medium disabled:opacity-50 dark:bg-white/10"
              onClick={() => importRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {busy === "import" ? "A importar…" : "Restaurar"}
            </button>
            <input
              ref={importRef}
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                void (async () => {
                  setBusy("import");
                  try {
                    const result = await importLibraryBackup(file);
                    await reload();
                    toast.success(`Restauradas ${result.songs} músicas`);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Falha ao restaurar");
                  } finally {
                    setBusy(null);
                    void storageEstimate().then(setInfo);
                  }
                })();
              }}
            />
          </div>
          <p className="mt-2 px-1 text-[12px] leading-relaxed text-neutral-500">
            A cópia fica no dispositivo (zip). No iPhone/iPad o Safari pode apagar dados se faltar
            espaço — exporte de vez em quando.
          </p>
        </section>

        <section>
          <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Reprodução
          </h2>
          <div className="rounded-2xl bg-black/[0.04] p-4 dark:bg-white/10">
            <p className="mb-2 text-[14px] font-medium">Crossfade</p>
            <div className="grid grid-cols-4 gap-2">
              {CROSSFADES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCrossfade(c.id)}
                  className={cn(
                    "h-11 rounded-xl text-[13px] font-medium",
                    crossfade === c.id
                      ? "bg-brand text-white"
                      : "bg-white text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-neutral-500">
              Transição suave entre faixas. Desligado = corte imediato.
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Aparência
          </h2>
          <div className="rounded-2xl bg-black/[0.04] p-4 dark:bg-white/10">
            <div className="grid grid-cols-3 gap-2">
              {appearances.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAppearance(id)}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-1 rounded-xl text-[13px] font-medium transition-colors",
                    appearance === id
                      ? "bg-brand text-white"
                      : "bg-white text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Cor de destaque
          </h2>
          <div className="rounded-2xl bg-black/[0.04] p-4 dark:bg-white/10">
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
              {ACCENTS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-label={c.label}
                  onClick={() => setAccent(c.value)}
                  className={cn(
                    "mx-auto flex h-11 w-11 items-center justify-center rounded-full transition-transform",
                    accent === c.value &&
                      "scale-110 ring-2 ring-offset-2 ring-brand ring-offset-white dark:ring-offset-black",
                  )}
                  style={{ backgroundColor: c.value }}
                >
                  {accent === c.value && (
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={3}>
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-[13px] text-neutral-500 dark:text-neutral-400">
              {ACCENTS.find((c) => c.value === accent)?.label ?? "Personalizada"}
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Privacidade
          </h2>
          <div className="flex items-start gap-3 rounded-2xl bg-black/[0.04] p-4 dark:bg-white/10">
            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-brand" />
            <p className="text-[14px] leading-relaxed text-neutral-600 dark:text-neutral-300">
              100% offline e sem conta. Nenhum dado é recolhido, enviado ou recebido da
              internet — as suas músicas e playlists ficam guardadas apenas neste dispositivo.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

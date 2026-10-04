import { Link } from "react-router";
import { ChevronRight, FileAudio, Moon, ShieldCheck, Smartphone, Sun } from "lucide-react";
import { useLibrary } from "@/providers/library";
import { usePlayerTheme, ACCENTS, type Appearance } from "@/providers/theme";
import { PageHeader } from "@/components/PageHeader";
import { formatBytes } from "@/lib/audio";
import { cn } from "@/lib/utils";

const appearances: { id: Appearance; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Claro", icon: Sun },
  { id: "dark", label: "Escuro", icon: Moon },
  { id: "auto", label: "Automático", icon: Smartphone },
];

export default function Settings() {
  const { accent, setAccent, appearance, setAppearance } = usePlayerTheme();
  const { songs } = useLibrary();
  const totalSize = songs.reduce((sum, s) => sum + (s.size || 0), 0);

  return (
    <div className="pb-6">
      <PageHeader title="Ajustes" />

      <div className="space-y-8 px-4 pt-2 lg:max-w-2xl lg:px-8">
        {/* Adicionar músicas */}
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
              <span className="text-neutral-500 dark:text-neutral-400">Espaço usado</span>
              <span className="tabular-nums">{formatBytes(totalSize)}</span>
            </div>
          </div>
        </section>

        {/* Aparência */}
        <section>
          <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Aparência
          </h2>
          <div className="rounded-2xl bg-black/[0.04] p-4 dark:bg-white/10">
            <div className="grid grid-cols-3 gap-2">
              {appearances.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
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

        {/* Cor de destaque */}
        <section>
          <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Cor de destaque
          </h2>
          <div className="rounded-2xl bg-black/[0.04] p-4 dark:bg-white/10">
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
              {ACCENTS.map((c) => (
                <button
                  key={c.id}
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

        {/* Privacidade */}
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

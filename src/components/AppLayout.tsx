import { NavLink, Outlet } from "react-router";
import { Library, Disc3, ListMusic, Search, Settings } from "lucide-react";
import { useLibrary } from "@/providers/library";
import { MiniPlayer } from "./MiniPlayer";
import { NowPlaying } from "./NowPlaying";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Músicas", icon: Library, end: true },
  { to: "/albums", label: "Álbuns", icon: Disc3 },
  { to: "/playlists", label: "Playlists", icon: ListMusic },
  { to: "/search", label: "Buscar", icon: Search },
  { to: "/settings", label: "Ajustes", icon: Settings },
];

export function AppLayout() {
  const { ready } = useLibrary();

  if (!ready) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center bg-white dark:bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-[var(--brand)]" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-white text-neutral-900 dark:bg-black dark:text-neutral-100">
      <div className="flex min-h-0 flex-1">
        {/* Sidebar (iPad / desktop) */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-black/5 bg-neutral-50 dark:border-white/10 dark:bg-neutral-950">
          <div className="px-6 pt-8 pb-6">
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-brand">Música</span>
            </h1>
          </div>
          <nav className="flex flex-col gap-1 px-3">
            {tabs.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors",
                    isActive
                      ? "bg-black/5 text-brand dark:bg-white/10"
                      : "text-neutral-600 hover:bg-black/5 dark:text-neutral-400 dark:hover:bg-white/5",
                  )
                }
              >
                <Icon className="h-5 w-5" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Conteúdo */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mini player + barra de tabs */}
      <div className="shrink-0">
        <MiniPlayer />
        <nav className="lg:hidden border-t border-black/5 bg-white/90 pb-safe backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/90">
          <div className="flex">
            {tabs.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 pt-1 text-[10px] font-medium",
                    isActive ? "text-brand" : "text-neutral-500 dark:text-neutral-400",
                  )
                }
              >
                <Icon className="h-6 w-6" />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>

      <NowPlaying />
    </div>
  );
}

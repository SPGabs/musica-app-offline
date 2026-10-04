import { lazy, Suspense } from "react"
import { Routes, Route } from "react-router"
import { Toaster } from "@/components/ui/sonner"
import { PlayerThemeProvider } from "@/providers/theme"
import { LibraryProvider } from "@/providers/library"
import { PlayerProvider } from "@/providers/player"
import { AppLayout } from "@/components/AppLayout"

const Library = lazy(() => import("@/pages/Library"))
const Albums = lazy(() => import("@/pages/Albums"))
const AlbumDetail = lazy(() => import("@/pages/AlbumDetail"))
const ArtistDetail = lazy(() => import("@/pages/ArtistDetail"))
const Playlists = lazy(() => import("@/pages/Playlists"))
const PlaylistDetail = lazy(() => import("@/pages/PlaylistDetail"))
const Liked = lazy(() => import("@/pages/Liked"))
const Recents = lazy(() => import("@/pages/Recents"))
const Search = lazy(() => import("@/pages/Search"))
const Settings = lazy(() => import("@/pages/Settings"))
const Upload = lazy(() => import("@/pages/Upload"))
const NotFound = lazy(() => import("@/pages/NotFound"))

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-[var(--brand)]" />
    </div>
  )
}

export default function App() {
  return (
    <PlayerThemeProvider>
      <LibraryProvider>
        <PlayerProvider>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Library />} />
                <Route path="/albums" element={<Albums />} />
                <Route path="/album" element={<AlbumDetail />} />
                <Route path="/artist" element={<ArtistDetail />} />
                <Route path="/playlists" element={<Playlists />} />
                <Route path="/playlists/:id" element={<PlaylistDetail />} />
                <Route path="/liked" element={<Liked />} />
                <Route path="/recents" element={<Recents />} />
                <Route path="/search" element={<Search />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/upload" element={<Upload />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Toaster position="top-center" richColors />
        </PlayerProvider>
      </LibraryProvider>
    </PlayerThemeProvider>
  )
}

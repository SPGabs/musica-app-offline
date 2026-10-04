import { Routes, Route } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { PlayerThemeProvider } from '@/providers/theme'
import { LibraryProvider } from '@/providers/library'
import { PlayerProvider } from '@/providers/player'
import { AppLayout } from '@/components/AppLayout'
import Library from '@/pages/Library'
import Albums from '@/pages/Albums'
import Playlists from '@/pages/Playlists'
import PlaylistDetail from '@/pages/PlaylistDetail'
import Search from '@/pages/Search'
import Settings from '@/pages/Settings'
import Upload from '@/pages/Upload'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <PlayerThemeProvider>
      <LibraryProvider>
        <PlayerProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Library />} />
              <Route path="/albums" element={<Albums />} />
              <Route path="/playlists" element={<Playlists />} />
              <Route path="/playlists/:id" element={<PlaylistDetail />} />
              <Route path="/search" element={<Search />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/upload" element={<Upload />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster position="top-center" richColors />
        </PlayerProvider>
      </LibraryProvider>
    </PlayerThemeProvider>
  )
}

import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AudioPlayerProvider } from "./contexts/AudioPlayerContext";
import GlobalAudioPlayer from "./components/Player/GlobalAudioPlayer";
import { NotificationsPanel } from "./components/Notifications/NotificationsPanel";
import { AnnouncementPopup } from "./components/Admin/AnnouncementPopup";

// Eager: entry route
import Index from "./pages/Index";

// Lazy-loaded routes to shrink initial bundle
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const Messages = lazy(() => import("./pages/Messages"));
const MessagesInbox = lazy(() => import("./pages/MessagesInbox"));
const Followers = lazy(() => import("./pages/Followers"));
const Following = lazy(() => import("./pages/Following"));
const Feed = lazy(() => import("./pages/Feed"));
const Trending = lazy(() => import("./pages/Trending"));
const Admin = lazy(() => import("./pages/Admin"));
const Actus = lazy(() => import("./pages/Actus"));
const Playlists = lazy(() => import("./pages/Playlists"));
const PlaylistDetail = lazy(() => import("./pages/PlaylistDetail"));
const Albums = lazy(() => import("./pages/Albums"));
const AlbumDetail = lazy(() => import("./pages/AlbumDetail"));
const TrackDetail = lazy(() => import("./pages/TrackDetail"));
const Search = lazy(() => import("./pages/Search"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      <p className="text-sm text-muted-foreground font-medium">Chargement…</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AudioPlayerProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/trending" element={<Trending />} />
              <Route path="/actus" element={<Actus />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/search" element={<Search />} />
              <Route path="/playlists" element={<Playlists />} />
              <Route path="/playlist/:id" element={<PlaylistDetail />} />
              <Route path="/albums" element={<Albums />} />
              <Route path="/album/:id" element={<AlbumDetail />} />
              <Route path="/track/:id" element={<TrackDetail />} />
              <Route path="/messages-inbox" element={<MessagesInbox />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="/messages/:username" element={<Messages />} />
              <Route path="/followers/:username" element={<Followers />} />
              <Route path="/following/:username" element={<Following />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <GlobalAudioPlayer />
          <NotificationsPanel />
          <AnnouncementPopup />
        </BrowserRouter>
      </AudioPlayerProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

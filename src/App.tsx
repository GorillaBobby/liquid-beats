import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AudioPlayerProvider } from "./contexts/AudioPlayerContext";
import GlobalAudioPlayer from "./components/Player/GlobalAudioPlayer";
import { NotificationsPanel } from "./components/Notifications/NotificationsPanel";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import MessagesInbox from "./pages/MessagesInbox";
import Followers from "./pages/Followers";
import Following from "./pages/Following";
import Feed from "./pages/Feed";
import Trending from "./pages/Trending";
import Admin from "./pages/Admin";
import Playlists from "./pages/Playlists";
import PlaylistDetail from "./pages/PlaylistDetail";
import Albums from "./pages/Albums";
import AlbumDetail from "./pages/AlbumDetail";
import TrackDetail from "./pages/TrackDetail";
import Search from "./pages/Search";
import NotFound from "./pages/NotFound";
import { AnnouncementPopup } from "./components/Admin/AnnouncementPopup";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AudioPlayerProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/trending" element={<Trending />} />
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
          <GlobalAudioPlayer />
          <NotificationsPanel />
          <AnnouncementPopup />
        </BrowserRouter>
      </AudioPlayerProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

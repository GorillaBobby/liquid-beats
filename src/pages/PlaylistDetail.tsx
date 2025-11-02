import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Play, Trash2, Shuffle, ArrowLeft } from "lucide-react";
import { TrackCard } from "@/components/Cards/TrackCard";

interface Track {
  id: string;
  title: string;
  artist: string;
  cover: string;
  audioUrl: string;
  lyrics?: string;
  position: number;
  playlistTrackId: string;
}

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  is_public: boolean;
  user_id: string;
}

export default function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setPlaylist } = useAudioPlayer();
  const [playlist, setPlaylistState] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user && id) {
      loadPlaylist();
    }
  }, [user, authLoading, id]);

  const loadPlaylist = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const { data: playlistData, error: playlistError } = await supabase
        .from("playlists")
        .select("*")
        .eq("id", id)
        .single();

      if (playlistError) throw playlistError;
      setPlaylistState(playlistData);

      const { data: playlistTracks, error: tracksError } = await supabase
        .from("playlist_tracks")
        .select("id, position, tracks!inner(*, profiles!inner(username, display_name, avatar_url))")
        .eq("playlist_id", id)
        .order("position", { ascending: true });

      if (tracksError) throw tracksError;

      const formattedTracks = playlistTracks.map((pt: any) => ({
        id: pt.tracks.id,
        title: pt.tracks.title,
        artist: pt.tracks.profiles.display_name || pt.tracks.profiles.username,
        cover: pt.tracks.cover_url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop",
        audioUrl: pt.tracks.audio_url,
        lyrics: pt.tracks.lyrics,
        position: pt.position,
        playlistTrackId: pt.id,
      }));

      setTracks(formattedTracks);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
      navigate("/playlists");
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    setPlaylist(tracks, 0);
  };

  const handleShuffle = () => {
    if (tracks.length === 0) return;
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    setPlaylist(shuffled, 0);
  };

  const handleRemoveTrack = async (playlistTrackId: string) => {
    try {
      const { error } = await supabase
        .from("playlist_tracks")
        .delete()
        .eq("id", playlistTrackId);

      if (error) throw error;

      setTracks(tracks.filter(t => t.playlistTrackId !== playlistTrackId));
      toast({ title: "Musique retirée", description: "La musique a été retirée de la playlist" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const handleTrackSelect = (index: number) => {
    setPlaylist(tracks, index);
  };

  if (authLoading || loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Chargement...</div>;
  }

  if (!playlist) return null;

  const isOwner = user?.id === playlist.user_id;

  return (
    <div className="min-h-screen bg-background pb-40 md:pb-8">
      <Sidebar />

      <main className="md:ml-64 p-4 md:p-8">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          size="icon"
          className="mb-4 md:hidden"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="mb-6 hidden md:flex"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-8 mb-8">
            <img
              src={playlist.cover_url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop"}
              alt={playlist.name}
              className="w-64 h-64 rounded-2xl object-cover shadow-glass"
            />
            <div className="flex-1 flex flex-col justify-end">
              <p className="text-sm text-muted-foreground mb-2">Playlist</p>
              <h1 className="text-5xl font-bold text-foreground mb-4">{playlist.name}</h1>
              {playlist.description && (
                <p className="text-muted-foreground mb-4">{playlist.description}</p>
              )}
              <p className="text-sm text-muted-foreground mb-6">{tracks.length} titre{tracks.length > 1 ? 's' : ''}</p>
              
              <div className="flex gap-4">
                <Button
                  onClick={handlePlayAll}
                  disabled={tracks.length === 0}
                  className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
                  size="lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Tout lire
                </Button>
                <Button
                  onClick={handleShuffle}
                  disabled={tracks.length === 0}
                  variant="outline"
                  className="bg-glass/30 border-glass-border"
                  size="lg"
                >
                  <Shuffle className="w-5 h-5 mr-2" />
                  Aléatoire
                </Button>
              </div>
            </div>
          </div>

          {tracks.length > 0 ? (
            <div className="space-y-2">
              {tracks.map((track, index) => (
                <div key={track.playlistTrackId} className="group bg-glass/30 backdrop-blur-glass rounded-xl p-4 border border-glass-border hover:bg-glass/50 transition-all flex items-center gap-4">
                  <span className="text-muted-foreground w-8 text-center">{index + 1}</span>
                  <img
                    src={track.cover}
                    alt={track.title}
                    className="w-14 h-14 rounded-lg object-cover cursor-pointer"
                    onClick={() => handleTrackSelect(index)}
                  />
                  <div className="flex-1 cursor-pointer" onClick={() => handleTrackSelect(index)}>
                    <h3 className="font-semibold text-foreground">{track.title}</h3>
                    <p className="text-sm text-muted-foreground">{track.artist}</p>
                  </div>
                  {isOwner && (
                    <Button
                      onClick={() => handleRemoveTrack(track.playlistTrackId)}
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <p className="text-muted-foreground text-lg">Cette playlist est vide</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

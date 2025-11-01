import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Play, Disc3, Plus, Share2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AddToPlaylistDialog } from "@/components/Track/AddToPlaylistDialog";

interface Track {
  id: string;
  title: string;
  cover_url: string | null;
  audio_url: string;
  lyrics: string | null;
}

interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  release_date: string | null;
  artist: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export default function AlbumDetail() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { setPlaylist } = useAudioPlayer();
  const { toast } = useToast();
  const [album, setAlbum] = useState<Album | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [addToPlaylistOpen, setAddToPlaylistOpen] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (id) {
      loadAlbum();
    }
  }, [id, user, authLoading]);

  const loadAlbum = async () => {
    try {
      setLoading(true);
      const { data: albumData, error: albumError } = await supabase
        .from("albums")
        .select("*, artist:profiles!albums_artist_id_fkey(*)")
        .eq("id", id)
        .single();

      if (albumError) throw albumError;
      setAlbum(albumData);

      const { data: tracksData, error: tracksError } = await supabase
        .from("tracks")
        .select("*")
        .eq("album_id", id)
        .order("created_at", { ascending: true });

      if (tracksError) throw tracksError;
      setTracks(tracksData || []);
    } catch (error) {
      console.error("Error loading album:", error);
      navigate("/albums");
    } finally {
      setLoading(false);
    }
  };

  const playAlbum = () => {
    if (tracks.length === 0) return;
    const playlist = tracks.map(track => ({
      id: track.id,
      title: track.title,
      artist: album?.artist.display_name || album?.artist.username || "",
      cover: track.cover_url || album?.cover_url || "",
      audioUrl: track.audio_url,
      lyrics: track.lyrics || "",
    }));
    setPlaylist(playlist, 0);
  };

  const handleShareAlbum = async () => {
    const shareUrl = `${window.location.origin}/album/${id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: album?.title,
          text: `Découvrez l'album "${album?.title}" de ${album?.artist.display_name || album?.artist.username}`,
          url: shareUrl,
        });
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Error sharing:", error);
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Lien copié",
        description: "Le lien de l'album a été copié dans le presse-papier",
      });
    }
  };

  const handleShareTrack = async (trackId: string, trackTitle: string) => {
    const shareUrl = `${window.location.origin}/track/${trackId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: trackTitle,
          text: `Écoutez "${trackTitle}" sur ${album?.title}`,
          url: shareUrl,
        });
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Error sharing:", error);
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Lien copié",
        description: "Le lien de la musique a été copié dans le presse-papier",
      });
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Chargement...</div>;
  }

  if (!album) return null;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
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
        
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 mb-6 md:mb-8">
            <div className="w-full aspect-square md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-glass flex-shrink-0">
              <img
                src={album.cover_url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop"}
                alt={album.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 flex flex-col justify-end">
              <p className="text-xs md:text-sm text-muted-foreground mb-2">ALBUM</p>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-3 md:mb-4">{album.title}</h1>
              <div className="flex items-center gap-2 text-sm md:text-base text-muted-foreground mb-3 md:mb-4 flex-wrap">
                <img
                  src={album.artist.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop"}
                  alt={album.artist.display_name || album.artist.username}
                  className="w-5 h-5 md:w-6 md:h-6 rounded-full"
                />
                <span
                  onClick={() => navigate(`/profile/${album.artist.username}`)}
                  className="font-semibold cursor-pointer hover:underline"
                >
                  {album.artist.display_name || album.artist.username}
                </span>
                {album.release_date && (
                  <>
                    <span>•</span>
                    <span>{new Date(album.release_date).getFullYear()}</span>
                  </>
                )}
                <span>•</span>
                <span>{tracks.length} titres</span>
              </div>
              {album.description && (
                <p className="text-sm md:text-base text-muted-foreground mb-4 line-clamp-3 md:line-clamp-none">{album.description}</p>
              )}
              <div className="flex gap-2 md:gap-3 flex-wrap">
                <Button
                  onClick={playAlbum}
                  size="lg"
                  className="bg-gradient-primary hover:shadow-glow transition-all duration-300 flex-1 md:flex-none"
                >
                  <Play className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  <span className="text-sm md:text-base">Lire</span>
                </Button>
                <Button
                  onClick={handleShareAlbum}
                  size="lg"
                  variant="secondary"
                  className="flex-1 md:flex-none"
                >
                  <Share2 className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  <span className="text-sm md:text-base">Partager</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-1 md:space-y-2">
            {tracks.map((track, index) => (
              <div
                key={track.id}
                className="flex items-center gap-2 md:gap-4 p-3 md:p-4 rounded-xl bg-glass/30 hover:bg-glass/50 transition-all group"
              >
                <span className="text-muted-foreground w-6 md:w-8 text-sm md:text-base">{index + 1}</span>
                <div
                  className="flex-1 cursor-pointer min-w-0"
                  onClick={() => {
                    const playlist = tracks.map(t => ({
                      id: t.id,
                      title: t.title,
                      artist: album.artist.display_name || album.artist.username,
                      cover: t.cover_url || album.cover_url || "",
                      audioUrl: t.audio_url,
                      lyrics: t.lyrics || "",
                    }));
                    setPlaylist(playlist, index);
                  }}
                >
                  <h3 className="font-semibold text-sm md:text-base text-foreground group-hover:text-primary transition-colors truncate">
                    {track.title}
                  </h3>
                </div>
                <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 md:h-10 md:w-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareTrack(track.id, track.title);
                    }}
                  >
                    <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 md:h-10 md:w-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTrackId(track.id);
                      setAddToPlaylistOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <AddToPlaylistDialog
            open={addToPlaylistOpen}
            onOpenChange={setAddToPlaylistOpen}
            trackId={selectedTrackId}
          />

          {tracks.length === 0 && (
            <div className="text-center py-16 md:py-24">
              <Disc3 className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground text-base md:text-lg">Cet album ne contient aucun titre</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

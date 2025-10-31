import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Layout/Sidebar";
import { MobileNav } from "@/components/Layout/MobileNav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Play, Share2, Download, Plus, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddToPlaylistDialog } from "@/components/Track/AddToPlaylistDialog";

interface Track {
  id: string;
  title: string;
  artist: string;
  cover: string;
  audioUrl: string;
  lyrics?: string;
  downloadable?: boolean;
  artistId?: string;
  albumId?: string;
  description?: string;
}

export default function TrackDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setPlaylist } = useAudioPlayer();
  const { toast } = useToast();
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);

  useEffect(() => {
    loadTrack();
  }, [id]);

  const loadTrack = async () => {
    try {
      setLoading(true);
      const { data: trackData, error } = await supabase
        .from("tracks")
        .select("*, profiles!inner(username, display_name)")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (trackData) {
        setTrack({
          id: trackData.id,
          title: trackData.title,
          artist: trackData.profiles.display_name || trackData.profiles.username,
          cover: trackData.cover_url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop",
          audioUrl: trackData.audio_url,
          lyrics: trackData.lyrics,
          downloadable: trackData.downloadable,
          artistId: trackData.artist_id,
          albumId: trackData.album_id,
          description: trackData.description,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger cette musique",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = () => {
    if (track) {
      setPlaylist([track], 0);
      // Increment play count
      supabase.rpc("increment_track_plays", { track_id: track.id });
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Lien copié",
        description: "Le lien de cette musique a été copié dans le presse-papier",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de copier le lien",
      });
    }
  };

  const handleDownload = async () => {
    if (!track?.audioUrl) return;

    try {
      const response = await fetch(track.audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${track.title}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Téléchargement démarré",
        description: `${track.title} est en cours de téléchargement`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de télécharger cette musique",
      });
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Chargement...</div>;
  }

  if (!track) return null;

  return (
    <div className="min-h-screen bg-background">
      <MobileNav />
      <Sidebar />
      
      <main className="md:ml-64 pb-32 p-4 md:p-8 pt-20 md:pt-8">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <div className="bg-glass/50 backdrop-blur-glass rounded-3xl p-6 md:p-8 border border-glass-border shadow-glass">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Cover Image */}
            <div className="w-full md:w-80 aspect-square rounded-2xl overflow-hidden shadow-glass">
              <img
                src={track.cover}
                alt={track.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Track Info */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-3">
                {track.title}
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-6">
                {track.artist}
              </p>

              {track.description && (
                <p className="text-foreground mb-6">{track.description}</p>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handlePlay}
                  size="lg"
                  className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Écouter
                </Button>

                <Button
                  onClick={handleShare}
                  variant="outline"
                  size="lg"
                  className="bg-glass/30 border-glass-border"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Partager
                </Button>

                {user && (
                  <Button
                    onClick={() => setPlaylistDialogOpen(true)}
                    variant="outline"
                    size="lg"
                    className="bg-glass/30 border-glass-border"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Ajouter à une playlist
                  </Button>
                )}

                {track.downloadable && (
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    size="lg"
                    className="bg-glass/30 border-glass-border"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Télécharger
                  </Button>
                )}
              </div>

              {/* Lyrics */}
              {track.lyrics && (
                <div className="mt-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">Paroles</h2>
                  <div className="bg-glass/30 rounded-2xl p-6 whitespace-pre-wrap text-foreground">
                    {track.lyrics}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {user && (
        <AddToPlaylistDialog
          open={playlistDialogOpen}
          onOpenChange={setPlaylistDialogOpen}
          trackId={track.id}
        />
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Check } from "lucide-react";

interface Playlist {
  id: string;
  name: string;
  cover_url: string | null;
}

interface AddToPlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string;
}

export const AddToPlaylistDialog = ({ open, onOpenChange, trackId }: AddToPlaylistDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [trackInPlaylists, setTrackInPlaylists] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      loadPlaylists();
    }
  }, [open, user]);

  const loadPlaylists = async () => {
    if (!user) return;

    try {
      const { data: playlistsData } = await supabase
        .from("playlists")
        .select("id, name, cover_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (playlistsData) {
        setPlaylists(playlistsData);

        // Check which playlists already contain this track
        const { data: existingTracks } = await supabase
          .from("playlist_tracks")
          .select("playlist_id")
          .eq("track_id", trackId)
          .in("playlist_id", playlistsData.map(p => p.id));

        if (existingTracks) {
          setTrackInPlaylists(new Set(existingTracks.map(t => t.playlist_id)));
        }
      }
    } catch (error) {
      console.error("Error loading playlists:", error);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!user) return;

    try {
      setLoading(true);

      if (trackInPlaylists.has(playlistId)) {
        // Remove from playlist
        await supabase
          .from("playlist_tracks")
          .delete()
          .eq("playlist_id", playlistId)
          .eq("track_id", trackId);

        setTrackInPlaylists(prev => {
          const newSet = new Set(prev);
          newSet.delete(playlistId);
          return newSet;
        });

        toast({ title: "Musique retirée", description: "La musique a été retirée de la playlist" });
      } else {
        // Get next position
        const { count } = await supabase
          .from("playlist_tracks")
          .select("*", { count: "exact", head: true })
          .eq("playlist_id", playlistId);

        await supabase
          .from("playlist_tracks")
          .insert({
            playlist_id: playlistId,
            track_id: trackId,
            position: (count || 0) + 1,
          });

        setTrackInPlaylists(prev => new Set(prev).add(playlistId));

        toast({ title: "Musique ajoutée ✓", description: "La musique a été ajoutée à la playlist" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-glass/95 backdrop-blur-glass border-glass-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Ajouter à une playlist</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
          {playlists.length > 0 ? (
            playlists.map((playlist) => {
              const isInPlaylist = trackInPlaylists.has(playlist.id);
              return (
                <button
                  key={playlist.id}
                  onClick={() => handleAddToPlaylist(playlist.id)}
                  disabled={loading}
                  className="w-full flex items-center gap-4 p-4 bg-glass/30 hover:bg-glass/50 rounded-xl transition-all border border-glass-border"
                >
                  <img
                    src={playlist.cover_url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100&h=100&fit=crop"}
                    alt={playlist.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <span className="flex-1 text-left font-semibold text-foreground">
                    {playlist.name}
                  </span>
                  {isInPlaylist ? (
                    <Check className="w-5 h-5 text-primary" />
                  ) : (
                    <Plus className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              );
            })
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Vous n'avez pas encore de playlist</p>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  window.location.href = "/playlists";
                }}
                className="bg-gradient-primary"
              >
                Créer une playlist
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

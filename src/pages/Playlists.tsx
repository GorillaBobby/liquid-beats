import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Layout/Sidebar";
import { MobileNav } from "@/components/Layout/MobileNav";
import { BottomNav } from "@/components/Layout/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { CreatePlaylistDialog } from "@/components/Playlist/CreatePlaylistDialog";
import { PlaylistCard } from "@/components/Playlist/PlaylistCard";

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  is_public: boolean;
  track_count: number;
}

export default function Playlists() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      loadPlaylists();
    }
  }, [user, authLoading]);

  const loadPlaylists = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data: playlistsData, error } = await supabase
        .from("playlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get track counts
      const playlistsWithCounts = await Promise.all(
        (playlistsData || []).map(async (playlist) => {
          const { count } = await supabase
            .from("playlist_tracks")
            .select("*", { count: "exact", head: true })
            .eq("playlist_id", playlist.id);

          return {
            ...playlist,
            track_count: count || 0,
          };
        })
      );

      setPlaylists(playlistsWithCounts);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileNav />
      <Sidebar />
      <BottomNav />

      <main className="md:ml-64 p-4 md:p-8 pb-40 md:pb-8 pt-20 md:pt-8">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          size="icon"
          className="mb-4 md:hidden"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Mes Playlists</h1>
            <p className="text-muted-foreground">Créez et gérez vos playlists</p>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer une playlist
          </Button>
        </div>

        {playlists.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onClick={() => navigate(`/playlist/${playlist.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="text-muted-foreground text-lg mb-4">Vous n'avez pas encore de playlist</p>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer votre première playlist
            </Button>
          </div>
        )}
      </main>

      <CreatePlaylistDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadPlaylists}
      />
    </div>
  );
}

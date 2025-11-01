import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Layout/Sidebar";
import { MobileNav } from "@/components/Layout/MobileNav";
import { BottomNav } from "@/components/Layout/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { Disc3, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Album {
  id: string;
  title: string;
  cover_url: string | null;
  artist: {
    username: string;
    display_name: string | null;
  };
}

export default function Albums() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    loadAlbums();
  }, [user, authLoading]);

  const loadAlbums = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("albums")
        .select("*, artist:profiles!albums_artist_id_fkey(username, display_name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAlbums(data || []);
    } catch (error) {
      console.error("Error loading albums:", error);
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
        
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Disc3 className="w-8 h-8" />
              Albums
            </h1>
            <p className="text-muted-foreground">Découvrez les albums des artistes</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {albums.map((album) => (
              <div
                key={album.id}
                onClick={() => navigate(`/album/${album.id}`)}
                className="group bg-glass/50 backdrop-blur-glass rounded-2xl p-4 border border-glass-border hover:bg-glass-hover transition-all duration-300 cursor-pointer"
              >
                <div className="aspect-square rounded-xl overflow-hidden mb-4 shadow-glass">
                  <img
                    src={album.cover_url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop"}
                    alt={album.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <h3 className="font-semibold text-foreground truncate mb-1">{album.title}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {album.artist.display_name || album.artist.username}
                </p>
              </div>
            ))}
          </div>

          {albums.length === 0 && (
            <div className="text-center py-24">
              <Disc3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground text-lg">Aucun album disponible</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

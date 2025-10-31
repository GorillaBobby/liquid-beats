import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import { ArtistCard } from "@/components/Cards/ArtistCard";

interface Artist {
  id: string;
  name: string;
  genre: string;
  image: string;
  followers: string;
  username: string;
  verified: boolean;
}

export default function Search() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (searchTerm.trim()) {
      searchArtists();
    } else {
      loadAllArtists();
    }
  }, [searchTerm]);

  const loadAllArtists = async () => {
    setLoading(true);
    const { data: artistsData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_type", "artist")
      .order("created_at", { ascending: false })
      .limit(50);

    if (artistsData) {
      const formattedArtists = await Promise.all(
        artistsData.map(async (a) => {
          const { count } = await supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("following_id", a.id);

          return {
            id: a.id,
            name: a.display_name || a.username,
            genre: "Artist",
            image: a.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop",
            followers: count ? `${count}` : "0",
            username: a.username,
            verified: a.verified || false,
          };
        })
      );
      setArtists(formattedArtists);
    }
    setLoading(false);
  };

  const searchArtists = async () => {
    setLoading(true);
    const { data: artistsData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_type", "artist")
      .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (artistsData) {
      const formattedArtists = await Promise.all(
        artistsData.map(async (a) => {
          const { count } = await supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("following_id", a.id);

          return {
            id: a.id,
            name: a.display_name || a.username,
            genre: "Artist",
            image: a.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop",
            followers: count ? `${count}` : "0",
            username: a.username,
            verified: a.verified || false,
          };
        })
      );
      setArtists(formattedArtists);
    }
    setLoading(false);
  };

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-64 p-8 pb-32">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">Rechercher des artistes</h1>
          <p className="text-muted-foreground mb-8">Trouvez vos artistes préférés</p>

          <div className="relative mb-8">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Rechercher un artiste..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 bg-glass/30 border-glass-border h-14 text-lg"
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Recherche en cours...</p>
            </div>
          ) : artists.length > 0 ? (
            <div className="grid grid-cols-3 gap-6">
              {artists.map((artist) => (
                <ArtistCard
                  key={artist.id}
                  {...artist}
                  onClick={() => navigate(`/profile/${artist.username}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {searchTerm ? "Aucun artiste trouvé" : "Aucun artiste inscrit"}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

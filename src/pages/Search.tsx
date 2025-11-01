import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Layout/Sidebar";
import { MobileNav } from "@/components/Layout/MobileNav";
import { BottomNav } from "@/components/Layout/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search as SearchIcon } from "lucide-react";
import { ArtistCard } from "@/components/Cards/ArtistCard";
import { TrackCard } from "@/components/Cards/TrackCard";

interface Artist {
  id: string;
  name: string;
  genre: string;
  image: string;
  followers: string;
  username: string;
  verified: boolean;
  verified_tier?: string;
}

interface Track {
  id: string;
  title: string;
  artist: string;
  cover: string;
  audioUrl: string;
  plays_count: number;
  lyrics?: string;
  downloadable?: boolean;
  artistId?: string;
}

export default function Search() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { setPlaylist } = useAudioPlayer();
  const [searchTerm, setSearchTerm] = useState("");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
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
      searchTracks();
    } else {
      loadAllArtists();
      loadAllTracks();
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
            verified_tier: (a as any).verified_tier,
          };
        })
      );
      setArtists(formattedArtists);
    }
    setLoading(false);
  };

  const loadAllTracks = async () => {
    setLoading(true);
    const { data: tracksData } = await supabase
      .from("tracks")
      .select("*, profiles!inner(username, display_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (tracksData) {
      const formattedTracks = tracksData.map((t) => ({
        id: t.id,
        title: t.title,
        artist: t.profiles.display_name || t.profiles.username,
        cover: t.cover_url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop",
        audioUrl: t.audio_url,
        plays_count: t.plays_count,
        lyrics: t.lyrics,
        downloadable: t.downloadable,
        artistId: t.artist_id,
      }));
      setTracks(formattedTracks);
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
            verified_tier: (a as any).verified_tier,
          };
        })
      );
      setArtists(formattedArtists);
    }
    setLoading(false);
  };

  const searchTracks = async () => {
    setLoading(true);
    const { data: tracksData } = await supabase
      .from("tracks")
      .select("*, profiles!inner(username, display_name, avatar_url)")
      .ilike("title", `%${searchTerm}%`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (tracksData) {
      const formattedTracks = tracksData.map((t) => ({
        id: t.id,
        title: t.title,
        artist: t.profiles.display_name || t.profiles.username,
        cover: t.cover_url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop",
        audioUrl: t.audio_url,
        plays_count: t.plays_count,
        lyrics: t.lyrics,
        downloadable: t.downloadable,
        artistId: t.artist_id,
      }));
      setTracks(formattedTracks);
    }
    setLoading(false);
  };

  const handleTrackSelect = (index: number) => {
    setPlaylist(tracks, index);
    if (tracks[index]?.id) {
      supabase.rpc("increment_track_plays", { track_id: tracks[index].id });
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileNav />
      <Sidebar />
      <BottomNav />

      <main className="md:ml-64 p-4 md:p-8 pb-24 md:pb-32 pt-20 md:pt-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">Rechercher</h1>
          <p className="text-muted-foreground mb-8">Trouvez vos artistes et musiques préférés</p>

          <div className="relative mb-8">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Rechercher des artistes ou des sons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 bg-glass/30 border-glass-border h-14 text-lg"
            />
          </div>

          <Tabs defaultValue="artists" className="w-full">
            <TabsList className="mb-6 bg-glass/30 border border-glass-border">
              <TabsTrigger value="artists">Artistes</TabsTrigger>
              <TabsTrigger value="tracks">Sons</TabsTrigger>
            </TabsList>

            <TabsContent value="artists">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Recherche en cours...</p>
                </div>
              ) : artists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
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
            </TabsContent>

            <TabsContent value="tracks">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Recherche en cours...</p>
                </div>
              ) : tracks.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {tracks.map((track, index) => (
                    <TrackCard
                      key={track.id}
                      {...track}
                      onClick={() => handleTrackSelect(index)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    {searchTerm ? "Aucun son trouvé" : "Aucun son disponible"}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

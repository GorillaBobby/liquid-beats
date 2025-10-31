import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Layout/Sidebar";
import { TrackCard } from "@/components/Cards/TrackCard";
import { ArtistCard } from "@/components/Cards/ArtistCard";
import { useAuth } from "@/hooks/useAuth";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

interface Track {
  id: string;
  title: string;
  artist: string;
  cover: string;
  audioUrl: string;
  lyrics?: string;
  downloadable?: boolean;
  artistId?: string;
}

interface Artist {
  id: string;
  name: string;
  genre: string;
  image: string;
  followers: string;
  username: string;
}

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { setPlaylist } = useAudioPlayer();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      loadData();
    }
  }, [user, authLoading]);

  const loadData = async () => {
    // Load tracks
    const { data: tracksData } = await supabase
      .from("tracks")
      .select("*, profiles!inner(username, display_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(12);

    if (tracksData) {
      const formattedTracks = tracksData.map((t) => ({
        id: t.id,
        title: t.title,
        artist: t.profiles.display_name || t.profiles.username,
        cover: t.cover_url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop",
        audioUrl: t.audio_url,
        lyrics: t.lyrics,
        downloadable: t.downloadable,
        artistId: t.artist_id,
      }));
      setTracks(formattedTracks);
    }

    // Load artists
    const { data: artistsData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_type", "artist")
      .limit(9);

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
  };

  const handleTrackSelect = (index: number) => {
    setPlaylist(tracks, index);
  };

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Chargement...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-64 pb-32 p-8">
        {/* Hero Section */}
        <section className="relative h-96 rounded-3xl overflow-hidden mb-12 shadow-glass">
          <img
            src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=1200&h=400&fit=crop"
            alt="Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-overlay" />
          <div className="absolute bottom-8 left-8 right-8">
            <h2 className="text-5xl font-bold text-foreground mb-4 animate-fade-in">
              Découvrez votre musique
            </h2>
            <p className="text-xl text-muted-foreground animate-fade-in">
              Les meilleurs titres sélectionnés pour vous
            </p>
          </div>
        </section>

        {/* Tendances */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-6">Musiques récentes</h2>
          {tracks.length > 0 ? (
            <div className="grid grid-cols-4 gap-6">
              {tracks.map((track, index) => (
                <TrackCard
                  key={track.id}
                  id={track.id}
                  {...track}
                  onClick={() => handleTrackSelect(index)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">Aucune musique pour le moment</p>
              <p className="text-sm text-muted-foreground">
                Les artistes peuvent uploader leurs musiques sur leur profil !
              </p>
            </div>
          )}
        </section>

        {/* Artistes populaires */}
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-6">Artistes</h2>
          {artists.length > 0 ? (
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
              <p className="text-muted-foreground">Aucun artiste inscrit pour le moment</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;

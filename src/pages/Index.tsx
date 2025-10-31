import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Layout/Sidebar";
import { MobileNav } from "@/components/Layout/MobileNav";
import { TrackCard } from "@/components/Cards/TrackCard";
import { AlbumCard } from "@/components/Cards/AlbumCard";
import { ArtistCard } from "@/components/Cards/ArtistCard";
import { useAuth } from "@/hooks/useAuth";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Button } from "@/components/ui/button";

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
}

interface Album {
  id: string;
  title: string;
  cover_url: string;
  artist: string;
  trackCount: number;
  artistId: string;
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
  const [albums, setAlbums] = useState<Album[]>([]);
  const [singleTracks, setSingleTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [displayedSinglesCount, setDisplayedSinglesCount] = useState(8);
  const [totalSinglesCount, setTotalSinglesCount] = useState(0);
  const [displayedAlbumsCount, setDisplayedAlbumsCount] = useState(6);
  const [totalAlbumsCount, setTotalAlbumsCount] = useState(0);
  const [displayedArtistsCount, setDisplayedArtistsCount] = useState(6);
  const [totalArtistsCount, setTotalArtistsCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      loadData();
    }
  }, [user, authLoading, displayedSinglesCount, displayedAlbumsCount, displayedArtistsCount]);

  const loadData = async () => {
    // Get total albums count
    const { count: albumsCount } = await supabase
      .from("albums")
      .select("*", { count: "exact", head: true });
    
    setTotalAlbumsCount(albumsCount || 0);

    // Load albums
    const { data: albumsData } = await supabase
      .from("albums")
      .select("*, profiles!inner(username, display_name)")
      .order("created_at", { ascending: false })
      .limit(displayedAlbumsCount);

    if (albumsData) {
      const albumsWithCount = await Promise.all(
        albumsData.map(async (album) => {
          const { count } = await supabase
            .from("tracks")
            .select("*", { count: "exact", head: true })
            .eq("album_id", album.id);
          
          return {
            id: album.id,
            title: album.title,
            cover_url: album.cover_url,
            artist: album.profiles.display_name || album.profiles.username,
            trackCount: count || 0,
            artistId: album.artist_id,
          };
        })
      );
      setAlbums(albumsWithCount);
    }

    // Get total singles count (tracks without album)
    const { count: singlesCount } = await supabase
      .from("tracks")
      .select("*", { count: "exact", head: true })
      .is("album_id", null);
    
    setTotalSinglesCount(singlesCount || 0);

    // Load singles (tracks without album)
    const { data: tracksData } = await supabase
      .from("tracks")
      .select("*, profiles!inner(username, display_name, avatar_url)")
      .is("album_id", null)
      .order("created_at", { ascending: false })
      .limit(displayedSinglesCount);

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
        albumId: t.album_id,
      }));
      setTracks(formattedTracks);
      setSingleTracks(formattedTracks);
    }

    // Get total artists count
    const { count: artistsCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("user_type", "artist");
    
    setTotalArtistsCount(artistsCount || 0);

    // Load artists
    const { data: artistsData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_type", "artist")
      .limit(displayedArtistsCount);

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
      <MobileNav />
      <Sidebar />
      
      <main className="md:ml-64 pb-32 p-4 md:p-8 pt-20 md:pt-8">
        {/* Hero Section */}
        <section className="relative h-48 md:h-96 rounded-2xl md:rounded-3xl overflow-hidden mb-8 md:mb-12 shadow-glass">
          <img
            src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=1200&h=400&fit=crop"
            alt="Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-overlay" />
          <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-8">
            <h2 className="text-2xl md:text-5xl font-bold text-foreground mb-2 md:mb-4 animate-fade-in">
              Découvrez votre musique
            </h2>
            <p className="text-sm md:text-xl text-muted-foreground animate-fade-in">
              Les meilleurs titres sélectionnés pour vous
            </p>
          </div>
        </section>

        {/* Albums récents */}
        {albums.length > 0 && (
          <section className="mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 md:mb-6">Albums récents</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-6">
              {albums.map((album) => (
                <AlbumCard
                  key={album.id}
                  id={album.id}
                  title={album.title}
                  artist={album.artist}
                  coverUrl={album.cover_url}
                  trackCount={album.trackCount}
                  artistId={album.artistId}
                  onDelete={loadData}
                />
              ))}
            </div>
            {displayedAlbumsCount < totalAlbumsCount && (
              <div className="text-center">
                <Button
                  onClick={() => setDisplayedAlbumsCount(prev => prev + 6)}
                  className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
                >
                  Afficher plus
                </Button>
              </div>
            )}
          </section>
        )}

        {/* Singles récents */}
        <section className="mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 md:mb-6">Singles récents</h2>
          {singleTracks.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6">
                {singleTracks.map((track, index) => (
                  <TrackCard
                    key={track.id}
                    id={track.id}
                    {...track}
                    onClick={() => handleTrackSelect(index)}
                  />
                ))}
              </div>
              {displayedSinglesCount < totalSinglesCount && (
                <div className="text-center">
                  <Button
                    onClick={() => setDisplayedSinglesCount(prev => prev + 8)}
                    className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
                  >
                    Afficher plus
                  </Button>
                </div>
              )}
            </>
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
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 md:mb-6">Artistes</h2>
          {artists.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mb-6">
                {artists.map((artist) => (
                  <ArtistCard
                    key={artist.id}
                    {...artist}
                    onClick={() => navigate(`/profile/${artist.username}`)}
                  />
                ))}
              </div>
              {displayedArtistsCount < totalArtistsCount && (
                <div className="text-center">
                  <Button
                    onClick={() => setDisplayedArtistsCount(prev => prev + 6)}
                    className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
                  >
                    Afficher plus
                  </Button>
                </div>
              )}
            </>
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

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Layout/Sidebar";
import { MobileNav } from "@/components/Layout/MobileNav";
import { BottomNav } from "@/components/Layout/BottomNav";
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
  artistVerified?: boolean;
  artistVerifiedTier?: string | null;
}

interface Album {
  id: string;
  title: string;
  cover_url: string;
  artist: string;
  trackCount: number;
  artistId: string;
  artistVerified: boolean;
  artistVerifiedTier: string | null;
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
      .select("*, profiles!inner(username, display_name, verified, verified_tier)")
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
            artistVerified: album.profiles.verified || false,
            artistVerifiedTier: album.profiles.verified_tier,
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
      .select("*, profiles!inner(username, display_name, avatar_url, verified, verified_tier)")
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
        artistVerified: t.profiles.verified || false,
        artistVerifiedTier: t.profiles.verified_tier,
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
            verified_tier: a.verified_tier,
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
      <BottomNav />
      
      <main className="md:ml-64 pb-40 md:pb-32 p-4 md:p-8 pt-20 md:pt-8">
        {/* Hero Section — Midnight Indigo aurora */}
        <section className="relative h-56 md:h-[26rem] rounded-2xl md:rounded-3xl overflow-hidden mb-8 md:mb-12 shadow-elegant bg-gradient-hero animate-gradient-shift bg-[length:200%_200%]">
          {/* Floating glow orbs */}
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-primary/30 blur-3xl animate-float" />
          <div className="absolute -bottom-24 -right-16 w-80 h-80 rounded-full bg-accent/25 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          <div className="absolute inset-0 bg-gradient-overlay" />
          <div className="relative h-full flex flex-col justify-end p-6 md:p-10">
            <span className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-primary-foreground/80 mb-3 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-primary-glow animate-glow" />
              Nouveau sur LiquidBeats
            </span>
            <h2 className="font-display text-3xl md:text-6xl font-bold mb-2 md:mb-4 animate-fade-in leading-[1.05]">
              Découvrez votre <span className="text-gradient">musique</span>
            </h2>
            <p className="text-sm md:text-xl text-muted-foreground max-w-xl animate-fade-in">
              Les meilleurs titres sélectionnés pour vous, dans une expérience immersive.
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

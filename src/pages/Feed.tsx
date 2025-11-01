import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Layout/Sidebar";
import { MobileNav } from "@/components/Layout/MobileNav";
import { BottomNav } from "@/components/Layout/BottomNav";
import { TrackCard } from "@/components/Cards/TrackCard";
import { ArtistCard } from "@/components/Cards/ArtistCard";
import { AlbumCard } from "@/components/Cards/AlbumCard";
import { useAuth } from "@/hooks/useAuth";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react";

interface Track {
  id: string;
  title: string;
  artist: string;
  cover: string;
  audioUrl: string;
  created_at: string;
  lyrics?: string;
  artistId?: string;
  downloadable?: boolean;
}

interface Artist {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  verified: boolean;
  verified_tier?: string;
}

interface Album {
  id: string;
  title: string;
  cover_url: string;
  artist: string;
  trackCount: number;
  artistId: string;
}

interface FeedCategory {
  title: string;
  tracks?: Track[];
  artists?: Artist[];
  albums?: Album[];
  type: 'tracks' | 'artists' | 'albums';
}

export default function Feed() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setPlaylist } = useAudioPlayer();
  const [categories, setCategories] = useState<FeedCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      loadFeed();
    }
  }, [user, authLoading]);

  const loadFeed = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const feedCategories: FeedCategory[] = [];

      // 1. Écoutés récemment
      const recentTracks = await getRecentlyPlayed();
      if (recentTracks.length > 0) {
        feedCategories.push({
          title: "Écoutés récemment",
          tracks: recentTracks,
          type: 'tracks'
        });
      }

      // 2. Vos artistes préférés (basé sur les follows)
      const favoriteArtists = await getFavoriteArtists();
      if (favoriteArtists.length > 0) {
        feedCategories.push({
          title: "Vos artistes préférés",
          artists: favoriteArtists,
          type: 'artists'
        });
      }

      // 3. Réécoutez vos anciens favoris (musiques likées)
      const likedTracks = await getLikedTracks();
      if (likedTracks.length > 0) {
        feedCategories.push({
          title: "Réécoutez vos anciens favoris",
          tracks: likedTracks,
          type: 'tracks'
        });
      }

      // 4. Recommandations du jour (nouveaux sons des artistes suivis)
      const dailyRecommendations = await getDailyRecommendations();
      if (dailyRecommendations.length > 0) {
        feedCategories.push({
          title: "Recommandations du jour",
          tracks: dailyRecommendations,
          type: 'tracks'
        });
      }

      // 5. Albums avec des titres que vous aimez
      const albumsWithLikedTracks = await getAlbumsWithLikedTracks();
      if (albumsWithLikedTracks.length > 0) {
        feedCategories.push({
          title: "Albums avec des titres que vous aimez",
          albums: albumsWithLikedTracks,
          type: 'albums'
        });
      }

      // 6. Vous pourriez aimer (basé sur vos artistes favoris)
      const suggestedTracks = await getSuggestedTracks();
      if (suggestedTracks.length > 0) {
        feedCategories.push({
          title: "Vous pourriez aimer",
          tracks: suggestedTracks,
          type: 'tracks'
        });
      }

      // 7. Conçu pour [username]
      const personalizedTracks = await getPersonalizedTracks();
      if (personalizedTracks.length > 0) {
        feedCategories.unshift({
          title: `Conçu pour ${user.email?.split('@')[0] || 'vous'}`,
          tracks: personalizedTracks,
          type: 'tracks'
        });
      }

      setCategories(feedCategories);
    } catch (error: any) {
      console.error("Error loading feed:", error);
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const getRecentlyPlayed = async (): Promise<Track[]> => {
    const { data } = await supabase
      .from("listening_history")
      .select("tracks!inner(*, profiles!inner(username, display_name))")
      .eq("user_id", user!.id)
      .order("played_at", { ascending: false })
      .limit(10);

    if (!data) return [];

    const uniqueTracks = new Map();
    data.forEach((item: any) => {
      if (!uniqueTracks.has(item.tracks.id)) {
        uniqueTracks.set(item.tracks.id, {
          id: item.tracks.id,
          title: item.tracks.title,
          artist: item.tracks.profiles.display_name || item.tracks.profiles.username,
          cover: item.tracks.cover_url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop",
          audioUrl: item.tracks.audio_url,
          created_at: item.tracks.created_at,
          lyrics: item.tracks.lyrics,
          artistId: item.tracks.artist_id,
          downloadable: item.tracks.downloadable,
        });
      }
    });

    return Array.from(uniqueTracks.values()).slice(0, 6);
  };

  const getFavoriteArtists = async (): Promise<Artist[]> => {
    const { data } = await supabase
      .from("follows")
      .select("profiles!follows_following_id_fkey(*)")
      .eq("follower_id", user!.id)
      .eq("profiles.user_type", "artist")
      .limit(6);

    if (!data) return [];

    return data.map((item: any) => ({
      id: item.profiles.id,
      username: item.profiles.username,
      display_name: item.profiles.display_name,
      avatar_url: item.profiles.avatar_url,
      verified: item.profiles.verified || false,
      verified_tier: item.profiles.verified_tier,
    }));
  };

  const getLikedTracks = async (): Promise<Track[]> => {
    const { data } = await supabase
      .from("likes")
      .select("tracks!inner(*, profiles!inner(username, display_name))")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(6);

    if (!data) return [];

    return data.map((item: any) => ({
      id: item.tracks.id,
      title: item.tracks.title,
      artist: item.tracks.profiles.display_name || item.tracks.profiles.username,
      cover: item.tracks.cover_url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop",
      audioUrl: item.tracks.audio_url,
      created_at: item.tracks.created_at,
      lyrics: item.tracks.lyrics,
      artistId: item.tracks.artist_id,
      downloadable: item.tracks.downloadable,
    }));
  };

  const getDailyRecommendations = async (): Promise<Track[]> => {
    const { data: followsData } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user!.id);

    if (!followsData || followsData.length === 0) return [];

    const followingIds = followsData.map(f => f.following_id);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 7);

    const { data } = await supabase
      .from("tracks")
      .select("*, profiles!inner(username, display_name)")
      .in("artist_id", followingIds)
      .gte("created_at", yesterday.toISOString())
      .order("created_at", { ascending: false })
      .limit(6);

    if (!data) return [];

    return data.map((track: any) => ({
      id: track.id,
      title: track.title,
      artist: track.profiles.display_name || track.profiles.username,
      cover: track.cover_url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop",
      audioUrl: track.audio_url,
      created_at: track.created_at,
      lyrics: track.lyrics,
      artistId: track.artist_id,
      downloadable: track.downloadable,
    }));
  };

  const getAlbumsWithLikedTracks = async (): Promise<Album[]> => {
    const { data: likedData } = await supabase
      .from("likes")
      .select("tracks!inner(album_id)")
      .eq("user_id", user!.id)
      .not("tracks.album_id", "is", null);

    if (!likedData || likedData.length === 0) return [];

    const albumIds = [...new Set(likedData.map((item: any) => item.tracks.album_id))];

    const { data: albumsData } = await supabase
      .from("albums")
      .select("*, artist:profiles!albums_artist_id_fkey(username, display_name)")
      .in("id", albumIds)
      .limit(6);

    if (!albumsData) return [];

    const albumsWithCount = await Promise.all(
      albumsData.map(async (album: any) => {
        const { count } = await supabase
          .from("tracks")
          .select("*", { count: "exact", head: true })
          .eq("album_id", album.id);

        return {
          id: album.id,
          title: album.title,
          cover_url: album.cover_url,
          artist: album.artist.display_name || album.artist.username,
          trackCount: count || 0,
          artistId: album.artist_id,
        };
      })
    );

    return albumsWithCount;
  };

  const getSuggestedTracks = async (): Promise<Track[]> => {
    const { data: followsData } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user!.id);

    if (!followsData || followsData.length === 0) return [];

    const followingIds = followsData.map(f => f.following_id);

    const { data } = await supabase
      .from("tracks")
      .select("*, profiles!inner(username, display_name)")
      .in("artist_id", followingIds)
      .order("plays_count", { ascending: false })
      .limit(6);

    if (!data) return [];

    return data.map((track: any) => ({
      id: track.id,
      title: track.title,
      artist: track.profiles.display_name || track.profiles.username,
      cover: track.cover_url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop",
      audioUrl: track.audio_url,
      created_at: track.created_at,
      lyrics: track.lyrics,
      artistId: track.artist_id,
      downloadable: track.downloadable,
    }));
  };

  const getPersonalizedTracks = async (): Promise<Track[]> => {
    // Mix de tout : récents, likés et recommandés
    const recent = await getRecentlyPlayed();
    const liked = await getLikedTracks();
    const suggested = await getSuggestedTracks();

    const allTracks = [...recent.slice(0, 2), ...liked.slice(0, 2), ...suggested.slice(0, 2)];
    const uniqueTracks = new Map();
    allTracks.forEach(track => {
      if (!uniqueTracks.has(track.id)) {
        uniqueTracks.set(track.id, track);
      }
    });

    return Array.from(uniqueTracks.values()).slice(0, 6);
  };

  const handleTrackSelect = (tracks: Track[], index: number) => {
    setPlaylist(tracks, index);
    
    // Enregistrer dans l'historique
    if (tracks[index]?.id) {
      supabase.from("listening_history").insert({
        user_id: user!.id,
        track_id: tracks[index].id,
      });
      supabase.rpc("increment_track_plays", { track_id: tracks[index].id });
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

      <main className="md:ml-64 pb-40 md:pb-32 p-4 md:p-8 pt-20 md:pt-8">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          size="icon"
          className="mb-4 md:hidden"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Mon Fil</h1>
          <p className="text-muted-foreground">Découvertes personnalisées pour vous</p>
        </div>

        {categories.length > 0 ? (
          <div className="space-y-12">
            {categories.map((category, categoryIndex) => (
              <section key={categoryIndex}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-foreground">{category.title}</h2>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>

                {category.type === 'tracks' && category.tracks && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {category.tracks.map((track, index) => (
                      <TrackCard
                        key={track.id}
                        {...track}
                        onClick={() => handleTrackSelect(category.tracks!, index)}
                      />
                    ))}
                  </div>
                )}

                {category.type === 'artists' && category.artists && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {category.artists.map((artist) => (
                      <ArtistCard
                        key={artist.id}
                        name={artist.display_name || artist.username}
                        genre="Artiste"
                        image={artist.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop"}
                        followers="0"
                        verified={artist.verified}
                        verified_tier={artist.verified_tier}
                        onClick={() => navigate(`/profile/${artist.username}`)}
                      />
                    ))}
                  </div>
                )}

                {category.type === 'albums' && category.albums && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {category.albums.map((album) => (
                      <AlbumCard
                        key={album.id}
                        id={album.id}
                        title={album.title}
                        artist={album.artist}
                        coverUrl={album.cover_url}
                        trackCount={album.trackCount}
                        artistId={album.artistId}
                      />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="text-muted-foreground text-lg mb-4">Commencez à écouter de la musique</p>
            <p className="text-sm text-muted-foreground mb-6">
              Suivez des artistes et écoutez des musiques pour obtenir des recommandations personnalisées !
            </p>
            <Button
              onClick={() => navigate("/search")}
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              Découvrir de la musique
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Layout/Sidebar";
import { MobileNav } from "@/components/Layout/MobileNav";
import { BottomNav } from "@/components/Layout/BottomNav";
import { TrackCard } from "@/components/Cards/TrackCard";
import { useAuth } from "@/hooks/useAuth";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { TrendingUp, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export default function Trending() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { setPlaylist } = useAudioPlayer();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(20);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      loadTrending();
    }
  }, [user, authLoading]);

  // Real-time updates for play counts
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('tracks-plays-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tracks'
        },
        (payload) => {
          setTracks((currentTracks) => 
            currentTracks.map((track) => 
              track.id === payload.new.id 
                ? { ...track, plays_count: payload.new.plays_count }
                : track
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadTrending = async () => {
    try {
      setLoading(true);
      const { data: tracksData, count } = await supabase
        .from("tracks")
        .select("*, profiles!inner(username, display_name, avatar_url)", { count: 'exact' })
        .order("plays_count", { ascending: false })
        .limit(100); // Load up to 100 tracks total

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
        setHasMore(formattedTracks.length > displayLimit);
      }
    } catch (error: any) {
      console.error("Error loading trending:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setDisplayLimit((prev) => prev + 20);
  };

  const handleTrackSelect = (index: number) => {
    setPlaylist(tracks, index);
  };

  if (authLoading || loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileNav />
      <Sidebar />
      <BottomNav />

      <main className="md:ml-64 pb-40 md:pb-48 p-4 md:p-8 pt-20 md:pt-8">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          size="icon"
          className="mb-4 md:hidden"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <section>
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-4xl font-bold text-foreground">Tendances</h1>
              <p className="text-muted-foreground">Les musiques les plus écoutées</p>
            </div>
          </div>

          {tracks.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {tracks.slice(0, displayLimit).map((track, index) => (
                  <div key={track.id} className="relative">
                    <div className="absolute -top-2 -left-2 z-10 w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center font-bold text-primary-foreground shadow-glow">
                      {index + 1}
                    </div>
                    <TrackCard
                      {...track}
                      onClick={() => handleTrackSelect(index)}
                    />
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      {track.plays_count} écoutes
                    </p>
                  </div>
                ))}
              </div>
              
              {displayLimit < tracks.length && (
                <div className="flex justify-center mt-8">
                  <Button
                    onClick={handleLoadMore}
                    variant="outline"
                    className="bg-glass/30 border-glass-border hover:bg-glass-hover"
                  >
                    Afficher plus
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-24">
              <p className="text-muted-foreground text-lg">Aucune musique dans les tendances</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

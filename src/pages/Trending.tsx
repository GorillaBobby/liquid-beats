import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Layout/Sidebar";
import { TrackCard } from "@/components/Cards/TrackCard";
import { useAuth } from "@/hooks/useAuth";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { TrendingUp } from "lucide-react";

interface Track {
  id: string;
  title: string;
  artist: string;
  cover: string;
  audioUrl: string;
  plays_count: number;
  lyrics?: string;
}

export default function Trending() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { setPlaylist } = useAudioPlayer();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      loadTrending();
    }
  }, [user, authLoading]);

  const loadTrending = async () => {
    try {
      setLoading(true);
      const { data: tracksData } = await supabase
        .from("tracks")
        .select("*, profiles!inner(username, display_name, avatar_url)")
        .order("plays_count", { ascending: false })
        .limit(20);

      if (tracksData) {
        const formattedTracks = tracksData.map((t) => ({
          id: t.id,
          title: t.title,
          artist: t.profiles.display_name || t.profiles.username,
          cover: t.cover_url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop",
          audioUrl: t.audio_url,
          plays_count: t.plays_count,
          lyrics: t.lyrics,
        }));
        setTracks(formattedTracks);
      }
    } catch (error: any) {
      console.error("Error loading trending:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackSelect = (index: number) => {
    setPlaylist(tracks, index);
    
    // Increment play count
    if (tracks[index]?.id) {
      supabase.rpc("increment_track_plays", { track_id: tracks[index].id });
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-64 pb-32 p-8">
        <section>
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-4xl font-bold text-foreground">Tendances</h1>
              <p className="text-muted-foreground">Les musiques les plus écoutées</p>
            </div>
          </div>

          {tracks.length > 0 ? (
            <div className="grid grid-cols-4 gap-6">
              {tracks.map((track, index) => (
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

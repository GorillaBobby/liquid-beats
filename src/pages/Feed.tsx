import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Layout/Sidebar";
import { MobileNav } from "@/components/Layout/MobileNav";
import { BottomNav } from "@/components/Layout/BottomNav";
import { TrackCard } from "@/components/Cards/TrackCard";
import { useAuth } from "@/hooks/useAuth";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface Track {
  id: string;
  title: string;
  artist: string;
  cover: string;
  audioUrl: string;
  created_at: string;
  lyrics?: string;
}

export default function Feed() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setPlaylist } = useAudioPlayer();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
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

      // Get users I follow
      const { data: followsData } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followingIds = followsData?.map((f) => f.following_id) || [];
      setFollowingIds(followingIds);

      // If no follows, show recommended tracks instead
      if (followingIds.length === 0) {
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
            created_at: t.created_at,
            lyrics: t.lyrics,
          }));
          setTracks(formattedTracks);
        }
        setLoading(false);
        return;
      }

      // Get tracks from followed artists
      const { data: tracksData } = await supabase
        .from("tracks")
        .select("*, profiles!inner(username, display_name, avatar_url)")
        .in("artist_id", followingIds)
        .order("created_at", { ascending: false });

      if (tracksData) {
        const formattedTracks = tracksData.map((t) => ({
          id: t.id,
          title: t.title,
          artist: t.profiles.display_name || t.profiles.username,
          cover: t.cover_url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop",
          audioUrl: t.audio_url,
          created_at: t.created_at,
          lyrics: t.lyrics,
        }));
        setTracks(formattedTracks);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    } finally {
      setLoading(false);
    }
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

      <main className="md:ml-64 pb-40 md:pb-32 p-4 md:p-8 pt-20 md:pt-8">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          size="icon"
          className="mb-4 md:hidden"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <section>
          <h1 className="text-4xl font-bold text-foreground mb-2">Votre fil d'actualité</h1>
          <p className="text-muted-foreground mb-8">
            {tracks.length > 0 && followingIds.length > 0
              ? "Nouvelles musiques des artistes que vous suivez"
              : "Musiques recommandées pour vous"}
          </p>

          {tracks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
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
            <div className="text-center py-24">
              <p className="text-muted-foreground text-lg mb-4">Votre fil est vide</p>
              <p className="text-sm text-muted-foreground mb-6">
                Suivez des artistes pour voir leurs nouvelles musiques ici !
              </p>
              <button
                onClick={() => navigate("/")}
                className="px-6 py-3 bg-gradient-primary rounded-xl text-primary-foreground hover:shadow-glow transition-all duration-300"
              >
                Découvrir des artistes
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

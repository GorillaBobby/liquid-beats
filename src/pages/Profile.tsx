import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Layout/Sidebar";
import { AudioPlayer } from "@/components/Player/AudioPlayer";
import { Button } from "@/components/ui/button";
import { TrackCard } from "@/components/Cards/TrackCard";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Upload, LogOut, MessageCircle, UserPlus, UserMinus, Edit, CheckCircle, Trash2 } from "lucide-react";
import { UploadTrackDialog } from "@/components/Upload/UploadTrackDialog";
import { EditProfileDialog } from "@/components/Profile/EditProfileDialog";
import { DeleteAccountDialog } from "@/components/Profile/DeleteAccountDialog";

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  user_type: "artist" | "fan";
  bio: string | null;
  avatar_url: string | null;
  verified: boolean;
}

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

export default function Profile() {
  const { username } = useParams();
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = !username || profile?.id === user?.id;

  useEffect(() => {
    if (authLoading) return; // Attendre la fin du chargement
    
    if (!user) {
      navigate("/auth");
      return;
    }
    loadProfile();
  }, [user, username, authLoading]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      let query = supabase.from("profiles").select("*");
      
      if (username) {
        query = query.eq("username", username);
      } else {
        query = query.eq("id", user!.id);
      }

      const { data: profileData, error: profileError } = await query.single();

      if (profileError) throw profileError;
      if (!profileData) {
        toast({ variant: "destructive", title: "Profil non trouvé" });
        navigate("/");
        return;
      }

      setProfile(profileData);

      // Load tracks if artist
      if (profileData.user_type === "artist") {
        const { data: tracksData } = await supabase
          .from("tracks")
          .select("*, profiles!inner(username, display_name)")
          .eq("artist_id", profileData.id)
          .order("created_at", { ascending: false });

        if (tracksData) {
          setTracks(
            tracksData.map((t) => ({
              id: t.id,
              title: t.title,
              artist: t.profiles.display_name || t.profiles.username,
              cover: t.cover_url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop",
              audioUrl: t.audio_url,
              lyrics: t.lyrics,
              downloadable: t.downloadable,
              artistId: t.artist_id,
            }))
          );
        }
      }

      // Check follow status and count
      if (!isOwnProfile && user) {
        const { data: followData } = await supabase
          .from("follows")
          .select("*")
          .eq("follower_id", user.id)
          .eq("following_id", profileData.id)
          .maybeSingle();

        setIsFollowing(!!followData);
      }

      const { count } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profileData.id);

      setFollowersCount(count || 0);

      // Get following count
      const { count: followingCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", profileData.id);

      setFollowingCount(followingCount || 0);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user || !profile) return;

    try {
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", profile.id);
        setIsFollowing(false);
        setFollowersCount((prev) => prev - 1);
      } else {
        await supabase.from("follows").insert({
          follower_id: user.id,
          following_id: profile.id,
        });
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const handleMessage = () => {
    navigate(`/messages/${profile?.username}`);
  };

  if (authLoading || loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Chargement...</div>;
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-64 pb-32 p-8">
        {/* Header Profile */}
        <div className="bg-glass/50 backdrop-blur-glass rounded-3xl p-8 border border-glass-border mb-8 shadow-glass">
          <div className="flex items-start gap-6">
            <img
              src={profile.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop"}
              alt={profile.display_name || profile.username}
              className="w-32 h-32 rounded-full object-cover shadow-glass"
            />
            
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-bold text-foreground">
                  {profile.display_name || profile.username}
                </h1>
                {profile.verified && (
                  <CheckCircle className="w-7 h-7 text-primary fill-primary" />
                )}
                <span className="px-3 py-1 rounded-full text-sm bg-gradient-primary text-primary-foreground">
                  {profile.user_type === "artist" ? "Artiste" : "Fan"}
                </span>
              </div>
              
              <p className="text-muted-foreground mb-4">@{profile.username}</p>
              {profile.bio && <p className="text-foreground mb-4">{profile.bio}</p>}
              
              <div className="flex gap-6 mb-4">
                <button
                  onClick={() => navigate(`/followers/${profile.username}`)}
                  className="text-sm hover:text-primary transition-colors"
                >
                  <span className="font-bold text-foreground">{followersCount}</span>{" "}
                  <span className="text-muted-foreground">abonnés</span>
                </button>
                <button
                  onClick={() => navigate(`/following/${profile.username}`)}
                  className="text-sm hover:text-primary transition-colors"
                >
                  <span className="font-bold text-foreground">{followingCount}</span>{" "}
                  <span className="text-muted-foreground">abonnements</span>
                </button>
              </div>

              <div className="flex gap-3">
                {isOwnProfile ? (
                  <>
                    <Button
                      onClick={() => setEditDialogOpen(true)}
                      className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier le profil
                    </Button>
                    {profile.user_type === "artist" && (
                      <Button
                        onClick={() => setUploadDialogOpen(true)}
                        variant="outline"
                        className="bg-glass/30 border-glass-border"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Ajouter une musique
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={signOut}
                      className="bg-glass/30 border-glass-border"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Déconnexion
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setDeleteDialogOpen(true)}
                      className="bg-glass/30 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer le compte
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleFollow}
                      className={isFollowing ? "bg-glass/30 border-glass-border" : "bg-gradient-primary"}
                      variant={isFollowing ? "outline" : "default"}
                    >
                      {isFollowing ? <UserMinus className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                      {isFollowing ? "Ne plus suivre" : "Suivre"}
                    </Button>
                    {profile.user_type === "artist" && (
                      <Button
                        onClick={handleMessage}
                        variant="outline"
                        className="bg-glass/30 border-glass-border"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tracks Section */}
        {profile.user_type === "artist" && (
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {isOwnProfile ? "Vos musiques" : "Musiques"}
            </h2>
            {tracks.length > 0 ? (
              <div className="grid grid-cols-4 gap-6">
                {tracks.map((track, index) => (
                  <TrackCard
                    key={track.id}
                    id={track.id}
                    {...track}
                    onDelete={loadProfile}
                    onClick={() => {
                      setCurrentIndex(index);
                      setCurrentTrack(track);
                      setTimeout(() => {
                        const audioEl = document.querySelector("audio");
                        if (audioEl) audioEl.play();
                      }, 100);
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                {isOwnProfile ? "Vous n'avez pas encore ajouté de musiques" : "Aucune musique"}
              </p>
            )}
          </section>
        )}
      </main>

      {currentTrack && (
        <AudioPlayer
          currentTrack={currentTrack}
          onNext={() => {
            const nextIndex = (currentIndex + 1) % tracks.length;
            setCurrentIndex(nextIndex);
            setCurrentTrack(tracks[nextIndex]);
          }}
          onPrevious={() => {
            const prevIndex = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1;
            setCurrentIndex(prevIndex);
            setCurrentTrack(tracks[prevIndex]);
          }}
        />
      )}

      <UploadTrackDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadSuccess={loadProfile}
      />

      <EditProfileDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={loadProfile}
        currentProfile={{
          display_name: profile?.display_name || null,
          bio: profile?.bio || null,
          avatar_url: profile?.avatar_url || null,
        }}
      />

      <DeleteAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </div>
  );
}

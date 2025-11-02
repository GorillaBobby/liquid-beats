import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, CheckCircle, ArrowLeft } from "lucide-react";

interface User {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  user_type: "artist" | "fan";
  verified?: boolean;
}

export default function Followers() {
  const { username } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [followers, setFollowers] = useState<User[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }
    loadFollowers();
    loadMyFollowing();
  }, [user, username, authLoading]);

  const loadFollowers = async () => {
    try {
      setLoading(true);
      
      // Get profile ID from username
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single();

      if (!profileData) return;

      // Get followers
      const { data: followsData } = await supabase
        .from("follows")
        .select("profiles!follows_follower_id_fkey(*)")
        .eq("following_id", profileData.id);

      if (followsData) {
        setFollowers(followsData.map((f: any) => f.profiles));
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const loadMyFollowing = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    if (data) {
      setFollowingIds(new Set(data.map((f) => f.following_id)));
    }
  };

  const handleFollow = async (userId: string) => {
    if (!user) return;

    try {
      if (followingIds.has(userId)) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", userId);
        
        setFollowingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: userId });
        
        setFollowingIds(prev => new Set(prev).add(userId));
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="md:ml-64 p-4 md:p-8 pb-40 md:pb-8">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          size="icon"
          className="mb-4 md:hidden"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8">Abonnés de @{username}</h1>
          
          <div className="space-y-4">
            {followers.length > 0 ? (
              followers.map((follower) => (
                <div
                  key={follower.id}
                  className="bg-glass/50 backdrop-blur-glass rounded-2xl p-6 border border-glass-border flex items-center gap-4"
                >
                  <img
                    src={follower.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop"}
                    alt={follower.display_name || follower.username}
                    className="w-16 h-16 rounded-full object-cover cursor-pointer"
                    onClick={() => navigate(`/profile/${follower.username}`)}
                  />
                  
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className="font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/profile/${follower.username}`)}
                    >
                      {follower.display_name || follower.username}
                    </h3>
                    {follower.verified && (
                      <CheckCircle className="w-5 h-5 text-primary fill-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">@{follower.username}</p>
                    <span className="text-xs px-2 py-1 rounded-full bg-glass/50 text-muted-foreground mt-1 inline-block">
                      {follower.user_type === "artist" ? "Artiste" : "Fan"}
                    </span>
                  </div>

                  {user?.id !== follower.id && (
                    <Button
                      onClick={() => handleFollow(follower.id)}
                      variant={followingIds.has(follower.id) ? "outline" : "default"}
                      className={followingIds.has(follower.id) ? "bg-glass/30 border-glass-border" : "bg-gradient-primary"}
                    >
                      {followingIds.has(follower.id) ? (
                        <>
                          <UserMinus className="w-4 h-4 mr-2" />
                          Ne plus suivre
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Suivre
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-12">Aucun abonné</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

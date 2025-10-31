import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus } from "lucide-react";

interface User {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  user_type: "artist" | "fan";
}

export default function Following() {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [following, setFollowing] = useState<User[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadFollowing();
    loadMyFollowing();
  }, [user, username]);

  const loadFollowing = async () => {
    try {
      setLoading(true);
      
      // Get profile ID from username
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single();

      if (!profileData) return;

      // Get following
      const { data: followsData } = await supabase
        .from("follows")
        .select("profiles!follows_following_id_fkey(*)")
        .eq("follower_id", profileData.id);

      if (followsData) {
        setFollowing(followsData.map((f: any) => f.profiles));
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
        
        // Remove from list if viewing own following
        if (user.id === following[0]?.id) {
          setFollowing(prev => prev.filter(u => u.id !== userId));
        }
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

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8">Abonnements de @{username}</h1>
          
          <div className="space-y-4">
            {following.length > 0 ? (
              following.map((user) => (
                <div
                  key={user.id}
                  className="bg-glass/50 backdrop-blur-glass rounded-2xl p-6 border border-glass-border flex items-center gap-4"
                >
                  <img
                    src={user.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop"}
                    alt={user.display_name || user.username}
                    className="w-16 h-16 rounded-full object-cover cursor-pointer"
                    onClick={() => navigate(`/profile/${user.username}`)}
                  />
                  
                  <div className="flex-1">
                    <h3
                      className="font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/profile/${user.username}`)}
                    >
                      {user.display_name || user.username}
                    </h3>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                    <span className="text-xs px-2 py-1 rounded-full bg-glass/50 text-muted-foreground mt-1 inline-block">
                      {user.user_type === "artist" ? "Artiste" : "Fan"}
                    </span>
                  </div>

                  <Button
                    onClick={() => handleFollow(user.id)}
                    variant={followingIds.has(user.id) ? "outline" : "default"}
                    className={followingIds.has(user.id) ? "bg-glass/30 border-glass-border" : "bg-gradient-primary"}
                  >
                    {followingIds.has(user.id) ? (
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
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-12">Aucun abonnement</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

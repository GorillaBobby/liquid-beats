import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge, CheckCircle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Artist {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  verified: boolean;
  user_type: string;
}

export default function Admin() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (adminLoading) return;
    
    if (!user || !isAdmin) {
      navigate("/");
      toast({
        variant: "destructive",
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions administrateur",
      });
      return;
    }
    
    loadArtists();
  }, [user, isAdmin, adminLoading]);

  const loadArtists = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_type", "artist")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setArtists(data || []);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const toggleVerification = async (artistId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ verified: !currentStatus })
        .eq("id", artistId);

      if (error) throw error;

      setArtists((prev) =>
        prev.map((artist) =>
          artist.id === artistId ? { ...artist, verified: !currentStatus } : artist
        )
      );

      toast({
        title: !currentStatus ? "Artiste certifié ✓" : "Certification retirée",
        description: "Le statut de certification a été mis à jour",
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const filteredArtists = artists.filter(
    (artist) =>
      artist.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artist.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (adminLoading || loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Badge className="w-8 h-8" />
              Panneau Admin
            </h1>
            <p className="text-muted-foreground">Gérez les certifications des artistes</p>
          </div>

          <div className="mb-6">
            <Input
              placeholder="Rechercher un artiste..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-glass/30 border-glass-border max-w-md"
            />
          </div>

          <div className="space-y-4">
            {filteredArtists.map((artist) => (
              <div
                key={artist.id}
                className="bg-glass/50 backdrop-blur-glass rounded-2xl p-6 border border-glass-border flex items-center gap-4"
              >
                <img
                  src={artist.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop"}
                  alt={artist.display_name || artist.username}
                  className="w-16 h-16 rounded-full object-cover"
                />

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground">
                      {artist.display_name || artist.username}
                    </h3>
                    {artist.verified && (
                      <CheckCircle className="w-5 h-5 text-primary fill-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">@{artist.username}</p>
                </div>

                <Button
                  onClick={() => toggleVerification(artist.id, artist.verified)}
                  variant={artist.verified ? "outline" : "default"}
                  className={
                    artist.verified
                      ? "bg-glass/30 border-glass-border"
                      : "bg-gradient-primary hover:shadow-glow transition-all duration-300"
                  }
                >
                  {artist.verified ? (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Retirer certification
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Certifier
                    </>
                  )}
                </Button>
              </div>
            ))}

            {filteredArtists.length === 0 && (
              <p className="text-center text-muted-foreground py-12">Aucun artiste trouvé</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

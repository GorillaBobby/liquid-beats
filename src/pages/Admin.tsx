import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge, CheckCircle, XCircle, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ADMIN_CODE = "ADMIN123456";

interface Artist {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  verified: boolean;
  user_type: string;
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [allTracks, setAllTracks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"artists" | "tracks">("artists");
  const [loading, setLoading] = useState(true);
  const [codeDialogOpen, setCodeDialogOpen] = useState(true);
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    
    if (isAuthenticated) {
      loadArtists();
      loadTracks();
    }
  }, [user, authLoading, isAuthenticated]);

  const handleVerifyCode = () => {
    if (code !== ADMIN_CODE) {
      toast({
        variant: "destructive",
        title: "Code incorrect",
        description: "Le code admin que vous avez entré est incorrect",
      });
      return;
    }

    setIsAuthenticated(true);
    setCodeDialogOpen(false);
    toast({
      title: "Accès autorisé ✓",
      description: "Bienvenue dans le panneau administrateur",
    });
  };

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

  const loadTracks = async () => {
    try {
      const { data: tracksData, error } = await supabase
        .from("tracks")
        .select("*, profiles!inner(username, display_name, avatar_url)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAllTracks(tracksData || []);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
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

  const deleteTrack = async (trackId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette musique ?")) return;

    try {
      const { error } = await supabase.from("tracks").delete().eq("id", trackId);

      if (error) throw error;

      setAllTracks((prev) => prev.filter((t) => t.id !== trackId));
      toast({
        title: "Musique supprimée",
        description: "La musique a été retirée de la plateforme",
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

  const filteredTracks = allTracks.filter(
    (track) =>
      track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      track.profiles.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Admin Code Dialog */}
      <Dialog open={codeDialogOpen} onOpenChange={(open) => {
        if (!open && !isAuthenticated) {
          navigate("/");
        }
        setCodeDialogOpen(open);
      }}>
        <DialogContent className="bg-glass/95 backdrop-blur-glass border-glass-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Code Administrateur
            </DialogTitle>
            <DialogDescription>
              Entrez le code administrateur pour accéder au panneau admin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div>
              <Input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Entrez le code admin"
                className="bg-glass/30 border-glass-border text-center text-lg font-mono tracking-wider"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleVerifyCode();
                  }
                }}
              />
            </div>

            <Button
              onClick={handleVerifyCode}
              disabled={isVerifying || !code}
              className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              {isVerifying ? "Vérification..." : "Vérifier"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {!isAuthenticated && (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      )}

      {isAuthenticated && (

      <main className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Badge className="w-8 h-8" />
              Panneau Admin
            </h1>
            <p className="text-muted-foreground">Gérez les certifications et le contenu</p>
          </div>

          <div className="flex gap-4 mb-6">
            <Button
              variant={activeTab === "artists" ? "default" : "outline"}
              onClick={() => setActiveTab("artists")}
              className={activeTab === "artists" ? "bg-gradient-primary" : "bg-glass/30 border-glass-border"}
            >
              Artistes
            </Button>
            <Button
              variant={activeTab === "tracks" ? "default" : "outline"}
              onClick={() => setActiveTab("tracks")}
              className={activeTab === "tracks" ? "bg-gradient-primary" : "bg-glass/30 border-glass-border"}
            >
              Musiques
            </Button>
          </div>

          <div className="mb-6">
            <Input
              placeholder={activeTab === "artists" ? "Rechercher un artiste..." : "Rechercher une musique..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-glass/30 border-glass-border max-w-md"
            />
          </div>

          {activeTab === "artists" ? (
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
          ) : (
            <div className="space-y-4">
              {filteredTracks.map((track) => (
                <div
                  key={track.id}
                  className="bg-glass/50 backdrop-blur-glass rounded-2xl p-6 border border-glass-border flex items-center gap-4"
                >
                  <img
                    src={track.cover_url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop"}
                    alt={track.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />

                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{track.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      par {track.profiles.display_name || track.profiles.username}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {track.plays_count} écoutes
                    </p>
                  </div>

                  <Button
                    onClick={() => deleteTrack(track.id)}
                    variant="outline"
                    className="bg-glass/30 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              ))}

              {filteredTracks.length === 0 && (
                <p className="text-center text-muted-foreground py-12">Aucune musique trouvée</p>
              )}
            </div>
          )}
        </div>
      </main>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Layout/Sidebar";
import { MobileNav } from "@/components/Layout/MobileNav";
import { BottomNav } from "@/components/Layout/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge, XCircle, Shield, Trash2, Users, MessageSquare, ArrowLeft, Megaphone, KeyRound, Loader2, Newspaper } from "lucide-react";
import { AnnouncementManager } from "@/components/Admin/AnnouncementManager";
import { ResetPasswordDialog } from "@/components/Admin/ResetPasswordDialog";
import { ActusManager } from "@/components/Admin/ActusManager";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import verifiedNormal from "@/assets/verified-normal.png";
import verifiedGold from "@/assets/verified-gold.png";

interface Artist {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  verified: boolean;
  verified_tier: string | null;
  user_type: string;
}

interface AdminLog {
  id: string;
  event_type: string;
  user_id: string | null;
  user_email: string | null;
  username: string | null;
  details: any;
  created_at: string;
}

interface User {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  user_type: string;
  created_at: string;
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [allTracks, setAllTracks] = useState<any[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allFeedbacks, setAllFeedbacks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"artists" | "tracks" | "users" | "logs" | "feedbacks" | "announcements" | "actus">("artists");
  const [loading, setLoading] = useState(true);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    
    if (!adminLoading) {
      if (!isAdmin) {
        setShowCodeDialog(true);
        setLoading(false);
      } else {
        loadData();
      }
    }
  }, [user, authLoading, isAdmin, adminLoading, navigate]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError("");
    setVerifying(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setCodeError("Vous devez être connecté pour accéder à l'admin");
        setVerifying(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('verify-admin-code', {
        body: { code: adminCode }
      });

      if (error) throw error;

      if (data?.valid) {
        setShowCodeDialog(false);
        toast({
          title: "Accès admin accordé",
          description: "Vous avez maintenant accès au panneau d'administration",
        });
        window.location.reload();
      } else {
        setCodeError("Code incorrect");
      }
    } catch (error: any) {
      console.error("Error verifying admin code:", error);
      setCodeError(error.message || "Erreur lors de la vérification");
    } finally {
      setVerifying(false);
    }
  };

  const loadData = () => {
    loadArtists();
    loadTracks();
    loadUsers();
    loadLogs();
    loadFeedbacks();
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

  const loadFeedbacks = async () => {
    try {
      const { data, error } = await supabase
        .from("feedbacks")
        .select("*, profiles!inner(username, display_name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAllFeedbacks(data || []);
    } catch (error: any) {
      console.error("Error loading feedbacks:", error);
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: "Erreur lors du chargement des feedbacks"
      });
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAllUsers(data || []);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const loadLogs = async () => {
    try {
      const { data: logsData, error } = await supabase
        .from("admin_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(logsData || []);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const toggleVerification = async (artistId: string, currentStatus: boolean, tier: string = "normal") => {
    try {
      const updateData = currentStatus 
        ? { verified: false, verified_tier: null }
        : { verified: true, verified_tier: tier };

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", artistId);

      if (error) throw error;

      setArtists((prev) =>
        prev.map((artist) =>
          artist.id === artistId 
            ? { ...artist, verified: !currentStatus, verified_tier: currentStatus ? null : tier } 
            : artist
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
      // Get track info first to delete storage files
      const track = allTracks.find(t => t.id === trackId);
      
      if (track) {
        // Delete audio file from storage
        if (track.audio_url) {
          const audioPath = track.audio_url.split('/').pop();
          if (audioPath) {
            await supabase.storage.from('audio-files').remove([audioPath]);
          }
        }
        
        // Delete cover image from storage
        if (track.cover_url) {
          const coverPath = track.cover_url.split('/').pop();
          if (coverPath) {
            await supabase.storage.from('cover-images').remove([coverPath]);
          }
        }
      }

      // Delete track from database
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

  const deleteUser = async (userId: string) => {
    const targetUser = allUsers.find(u => u.id === userId);
    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement le compte de ${targetUser?.display_name || targetUser?.username} et toutes ses données ?`)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Vous devez être connecté");
      }

      const { data, error } = await supabase.functions.invoke("admin-delete-account", {
        body: { userId },
      });

      if (error) throw error;

      setAllUsers((prev) => prev.filter((u) => u.id !== userId));
      setArtists((prev) => prev.filter((a) => a.id !== userId));
      
      toast({
        title: "Compte supprimé",
        description: "Le compte et toutes les données associées ont été supprimés définitivement",
      });
      
      loadUsers();
      loadArtists();
      loadFeedbacks();
    } catch (error: any) {
      console.error("Delete user error:", error);
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: error.message || "Impossible de supprimer le compte"
      });
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

  const filteredUsers = allUsers.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFeedbacks = allFeedbacks.filter(
    (feedback) =>
      feedback.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateFeedbackStatus = async (feedbackId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("feedbacks")
        .update({ status: newStatus })
        .eq("id", feedbackId);

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: "Le feedback a été mis à jour avec succès",
      });
      loadFeedbacks();
    } catch (error: any) {
      console.error("Error updating feedback:", error);
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: "Erreur lors de la mise à jour"
      });
    }
  };

  if (authLoading || adminLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Chargement...</div>;
  }

  if (!isAdmin && !showCodeDialog) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Accès refusé</div>;
  }

  return (
    <>
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Accès Admin</DialogTitle>
            <DialogDescription>
              Entrez le code d'accès administrateur pour continuer
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminCode">Code d'accès</Label>
              <Input
                id="adminCode"
                type="password"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                placeholder="Entrez le code"
                disabled={verifying}
              />
              {codeError && (
                <p className="text-sm text-destructive">{codeError}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={verifying}>
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vérification...
                </>
              ) : (
                "Vérifier"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-background">
        <MobileNav />
        <Sidebar />
        <BottomNav />

        <main className="md:ml-64 p-4 md:p-8 pb-40 md:pb-8 pt-20 md:pt-8">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            size="icon"
            className="mb-4 md:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 md:mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Badge className="w-8 h-8" />
                Panneau Admin
              </h1>
              <p className="text-muted-foreground">Gérez les certifications et le contenu</p>
            </div>

            <div className="flex flex-wrap gap-2 md:gap-4 mb-6">
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
              <Button
                variant={activeTab === "users" ? "default" : "outline"}
                onClick={() => setActiveTab("users")}
                className={activeTab === "users" ? "bg-gradient-primary" : "bg-glass/30 border-glass-border"}
              >
                <Users className="w-4 h-4 mr-2" />
                Utilisateurs
              </Button>
              <Button
                variant={activeTab === "logs" ? "default" : "outline"}
                onClick={() => setActiveTab("logs")}
                className={activeTab === "logs" ? "bg-gradient-primary" : "bg-glass/30 border-glass-border"}
              >
                Logs
              </Button>
              <Button
                variant={activeTab === "feedbacks" ? "default" : "outline"}
                onClick={() => setActiveTab("feedbacks")}
                className={activeTab === "feedbacks" ? "bg-gradient-primary" : "bg-glass/30 border-glass-border"}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Feedbacks
              </Button>
              <Button
                variant={activeTab === "announcements" ? "default" : "outline"}
                onClick={() => setActiveTab("announcements")}
                className={activeTab === "announcements" ? "bg-gradient-primary" : "bg-glass/30 border-glass-border"}
              >
                <Megaphone className="w-4 h-4 mr-2" />
                Annonces
              </Button>
              <Button
                variant={activeTab === "actus" ? "default" : "outline"}
                onClick={() => setActiveTab("actus")}
                className={activeTab === "actus" ? "bg-gradient-primary" : "bg-glass/30 border-glass-border"}
              >
                <Newspaper className="w-4 h-4 mr-2" />
                Actus
              </Button>
            </div>

            {activeTab !== "logs" && activeTab !== "feedbacks" && activeTab !== "announcements" && activeTab !== "actus" && (
              <div className="mb-6">
                <Input
                  placeholder={
                    activeTab === "artists" 
                      ? "Rechercher un artiste..." 
                      : activeTab === "tracks"
                      ? "Rechercher une musique..."
                      : activeTab === "users"
                      ? "Rechercher un utilisateur..."
                      : "Rechercher dans les feedbacks..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-glass/30 border-glass-border max-w-md"
                />
              </div>
            )}

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
                        <img 
                          src={artist.verified_tier === "gold" ? verifiedGold : verifiedNormal} 
                          alt="Vérifié" 
                          className="w-5 h-5" 
                        />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">@{artist.username}</p>
                  </div>

                  {artist.verified ? (
                    <Button
                      onClick={() => toggleVerification(artist.id, artist.verified)}
                      variant="outline"
                      className="bg-glass/30 border-glass-border"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Retirer certification
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Select onValueChange={(tier) => toggleVerification(artist.id, false, tier)}>
                        <SelectTrigger className="w-[180px] bg-gradient-primary border-none">
                          <SelectValue placeholder="Certifier" />
                        </SelectTrigger>
                        <SelectContent className="bg-glass/95 backdrop-blur-glass border-glass-border">
                          <SelectItem value="normal">
                            <div className="flex items-center gap-2">
                              <img src={verifiedNormal} alt="Normal" className="w-4 h-4" />
                              <span>Normal</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="gold">
                            <div className="flex items-center gap-2">
                              <img src={verifiedGold} alt="Gold" className="w-4 h-4" />
                              <span>Gold</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                ))}

                {filteredArtists.length === 0 && (
                  <p className="text-center text-muted-foreground py-12">Aucun artiste trouvé</p>
                )}
              </div>
            ) : activeTab === "tracks" ? (
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
            ) : activeTab === "users" ? (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="bg-glass/50 backdrop-blur-glass rounded-2xl p-6 border border-glass-border flex items-center gap-4"
                  >
                    <img
                      src={user.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop"}
                      alt={user.display_name || user.username}
                      className="w-16 h-16 rounded-full object-cover"
                    />

                    <div className="flex-1">
                      <h3 className="font-bold text-foreground">
                        {user.display_name || user.username}
                      </h3>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Type: {user.user_type === 'artist' ? 'Artiste' : 'Fan'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Inscrit le: {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setSelectedUserEmail("");
                          setResetPasswordOpen(true);
                        }}
                        variant="outline"
                        className="bg-glass/30 border-glass-border hover:bg-glass/50"
                      >
                        <KeyRound className="w-4 h-4 mr-2" />
                        Réinitialiser MDP
                      </Button>
                      <Button
                        onClick={() => deleteUser(user.id)}
                        variant="outline"
                        className="bg-glass/30 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer le compte
                      </Button>
                    </div>
                  </div>
                ))}

                {filteredUsers.length === 0 && (
                  <p className="text-center text-muted-foreground py-12">Aucun utilisateur trouvé</p>
                )}
              </div>
            ) : activeTab === "feedbacks" ? (
              <div className="bg-glass/50 backdrop-blur-glass rounded-2xl border border-glass-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-glass/30 border-b border-glass-border">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Date</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Utilisateur</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Sujet</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Message</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Statut</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-glass-border">
                      {filteredFeedbacks.map((feedback) => (
                        <tr key={feedback.id} className="hover:bg-glass/30 transition-colors">
                          <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                            {new Date(feedback.created_at).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">
                                {feedback.profiles?.display_name || feedback.profiles?.username}
                              </span>
                              <span className="text-xs text-muted-foreground">@{feedback.profiles?.username}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground max-w-xs truncate">
                            {feedback.subject}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground max-w-md">
                            <div className="line-clamp-2">{feedback.message}</div>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={feedback.status}
                              onChange={(e) => updateFeedbackStatus(feedback.id, e.target.value)}
                              className="text-sm px-3 py-1 rounded-lg bg-background border border-glass-border"
                            >
                              <option value="pending">En attente</option>
                              <option value="in_progress">En cours</option>
                              <option value="resolved">Résolu</option>
                              <option value="rejected">Rejeté</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `Sujet: ${feedback.subject}\nMessage: ${feedback.message}\nDe: ${feedback.profiles?.username}`
                                );
                                toast({
                                  title: "Copié",
                                  description: "Feedback copié dans le presse-papier",
                                });
                              }}
                            >
                              Copier
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredFeedbacks.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Aucun feedback trouvé</p>
                  </div>
                )}
              </div>
            ) : activeTab === "announcements" ? (
              <AnnouncementManager />
            ) : activeTab === "actus" ? (
              <ActusManager />
            ) : (
              <div className="space-y-4">
                <div className="bg-glass/50 backdrop-blur-glass rounded-2xl p-6 border border-glass-border">
                  <h3 className="font-bold text-foreground mb-4">Activités récentes</h3>
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <div key={log.id} className="bg-glass/30 rounded-lg p-4 border border-glass-border">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-foreground">
                            {log.event_type === 'new_user' && '👤 Nouveau compte'}
                            {log.event_type === 'new_track' && '🎵 Nouvelle musique'}
                            {log.event_type === 'new_album' && '💿 Nouvel album'}
                            {log.event_type === 'verification_change' && '✓ Changement de certification'}
                            {log.event_type === 'account_deletion' && '🗑️ Suppression de compte'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {log.user_email && <p>Email: {log.user_email}</p>}
                          {log.username && <p>Username: {log.username}</p>}
                          {log.details && (
                            <pre className="mt-2 text-xs bg-background/50 p-2 rounded overflow-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))}
                    {logs.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">Aucune activité récente</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        <ResetPasswordDialog
          open={resetPasswordOpen}
          onOpenChange={setResetPasswordOpen}
          initialEmail={selectedUserEmail}
        />
      </div>
    </>
  );
}

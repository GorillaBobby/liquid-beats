import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Plus, Edit, Trash2 } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const AnnouncementManager = () => {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    const { data, error } = await supabase
      .from("admin_announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
      return;
    }

    setAnnouncements(data || []);
  };

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({ variant: "destructive", title: "Erreur", description: "Titre et description requis" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("admin_announcements").insert({
      title: formData.title.trim(),
      description: formData.description.trim(),
      is_active: false,
    });

    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    } else {
      toast({ title: "Succès", description: "Annonce créée" });
      setFormData({ title: "", description: "" });
      setCreating(false);
      loadAnnouncements();
    }
    setLoading(false);
  };

  const handleUpdate = async (id: string) => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({ variant: "destructive", title: "Erreur", description: "Titre et description requis" });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("admin_announcements")
      .update({
        title: formData.title.trim(),
        description: formData.description.trim(),
      })
      .eq("id", id);

    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    } else {
      toast({ title: "Succès", description: "Annonce mise à jour" });
      setEditing(null);
      setFormData({ title: "", description: "" });
      loadAnnouncements();
    }
    setLoading(false);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("admin_announcements")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    } else {
      toast({
        title: "Succès",
        description: `Annonce ${!currentStatus ? "activée" : "désactivée"}`,
      });
      loadAnnouncements();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette annonce ?")) return;

    const { error } = await supabase.from("admin_announcements").delete().eq("id", id);

    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    } else {
      toast({ title: "Succès", description: "Annonce supprimée" });
      loadAnnouncements();
    }
  };

  const startEdit = (announcement: Announcement) => {
    setEditing(announcement.id);
    setFormData({ title: announcement.title, description: announcement.description });
    setCreating(false);
  };

  const cancelEdit = () => {
    setEditing(null);
    setCreating(false);
    setFormData({ title: "", description: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Gestion des Annonces</h2>
        <Button
          onClick={() => {
            setCreating(true);
            setEditing(null);
            setFormData({ title: "", description: "" });
          }}
          className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle annonce
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(creating || editing) && (
        <Card className="p-6 bg-glass/50 backdrop-blur-glass border-glass-border">
          <h3 className="text-xl font-bold text-foreground mb-4">
            {creating ? "Créer une annonce" : "Modifier l'annonce"}
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Titre de l'annonce"
                className="bg-glass/30 border-glass-border"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description de l'annonce"
                rows={4}
                className="bg-glass/30 border-glass-border"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => (creating ? handleCreate() : handleUpdate(editing!))}
                disabled={loading}
                className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
              >
                {loading ? "Enregistrement..." : creating ? "Créer" : "Mettre à jour"}
              </Button>
              <Button onClick={cancelEdit} variant="outline" className="bg-glass/30 border-glass-border">
                Annuler
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="p-6 bg-glass/50 backdrop-blur-glass border-glass-border">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-foreground">{announcement.title}</h3>
                  {announcement.is_active && (
                    <span className="px-2 py-1 text-xs rounded-full bg-gradient-primary text-primary-foreground">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mb-4">{announcement.description}</p>
                <p className="text-xs text-muted-foreground">
                  Créée le {new Date(announcement.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 mr-4">
                  <Label htmlFor={`active-${announcement.id}`} className="text-sm">
                    {announcement.is_active ? "Active" : "Inactive"}
                  </Label>
                  <Switch
                    id={`active-${announcement.id}`}
                    checked={announcement.is_active}
                    onCheckedChange={() => handleToggleActive(announcement.id, announcement.is_active)}
                  />
                </div>
                <Button
                  onClick={() => startEdit(announcement)}
                  variant="outline"
                  size="icon"
                  className="bg-glass/30 border-glass-border"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleDelete(announcement.id)}
                  variant="outline"
                  size="icon"
                  className="bg-glass/30 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {announcements.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Aucune annonce pour le moment</p>
        )}
      </div>
    </div>
  );
};
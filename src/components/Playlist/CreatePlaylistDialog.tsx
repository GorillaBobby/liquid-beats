import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";

interface CreatePlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreatePlaylistDialog = ({ open, onOpenChange, onSuccess }: CreatePlaylistDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const handleCreate = async () => {
    if (!user || !name.trim()) {
      toast({ variant: "destructive", title: "Le nom de la playlist est requis" });
      return;
    }

    try {
      setCreating(true);

      const { error } = await supabase.from("playlists").insert({
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        is_public: isPublic,
      });

      if (error) throw error;

      toast({
        title: "Playlist créée !",
        description: "Vous pouvez maintenant y ajouter des musiques",
      });

      setName("");
      setDescription("");
      setIsPublic(true);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-glass/95 backdrop-blur-glass border-glass-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Créer une playlist
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ma super playlist"
              className="bg-glass/30 border-glass-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de votre playlist..."
              className="bg-glass/30 border-glass-border resize-none"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="public">Playlist publique</Label>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          <Button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            {creating ? "Création..." : "Créer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

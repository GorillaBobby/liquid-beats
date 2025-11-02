import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, X } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const ActusManager = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
  });

  const { data: actus } = useQuery({
    queryKey: ["admin-actus"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("actus")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("actus").insert([
        {
          ...data,
          author_id: (await supabase.auth.getUser()).data.user?.id,
        },
      ]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Actu créée avec succès");
      queryClient.invalidateQueries({ queryKey: ["admin-actus"] });
      queryClient.invalidateQueries({ queryKey: ["actus"] });
      setIsCreating(false);
      setFormData({ title: "", description: "", image_url: "" });
    },
    onError: () => {
      toast.error("Erreur lors de la création de l'actu");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("actus")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Actu mise à jour avec succès");
      queryClient.invalidateQueries({ queryKey: ["admin-actus"] });
      queryClient.invalidateQueries({ queryKey: ["actus"] });
      setEditingId(null);
      setFormData({ title: "", description: "", image_url: "" });
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour de l'actu");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("actus").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Actu supprimée avec succès");
      queryClient.invalidateQueries({ queryKey: ["admin-actus"] });
      queryClient.invalidateQueries({ queryKey: ["actus"] });
    },
    onError: () => {
      toast.error("Erreur lors de la suppression de l'actu");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (actu: any) => {
    setEditingId(actu.id);
    setFormData({
      title: actu.title,
      description: actu.description,
      image_url: actu.image_url || "",
    });
    setIsCreating(true);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({ title: "", description: "", image_url: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Actus</h2>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Actu
          </Button>
        )}
      </div>

      {isCreating && (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={6}
                required
              />
            </div>
            <div>
              <Label htmlFor="image_url">URL de l'image</Label>
              <Input
                id="image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) =>
                  setFormData({ ...formData, image_url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">
                {editingId ? "Mettre à jour" : "Créer"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-4">
        {actus?.map((actu) => (
          <Card key={actu.id} className="p-6">
            <div className="flex gap-4">
              {actu.image_url && (
                <OptimizedImage
                  src={actu.image_url}
                  alt={actu.title}
                  className="w-32 h-32 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">{actu.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {format(new Date(actu.created_at), "d MMMM yyyy", { locale: fr })}
                </p>
                <p className="text-sm line-clamp-2">{actu.description}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleEdit(actu)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => deleteMutation.mutate(actu.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
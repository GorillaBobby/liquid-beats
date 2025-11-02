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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
      let imageUrl = data.image_url;

      // Upload image if file is selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from('actus-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('actus-images')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      const { error } = await supabase.from("actus").insert([
        {
          title: data.title,
          description: data.description,
          image_url: imageUrl,
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
      setImageFile(null);
      setImagePreview(null);
    },
    onError: () => {
      toast.error("Erreur lors de la création de l'actu");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      let imageUrl = data.image_url;

      // Upload new image if file is selected
      if (imageFile) {
        // Delete old image if exists
        const oldActu = actus?.find(a => a.id === id);
        if (oldActu?.image_url) {
          const oldPath = oldActu.image_url.split('/').pop();
          if (oldPath) {
            await supabase.storage.from('actus-images').remove([oldPath]);
          }
        }

        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from('actus-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('actus-images')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      const { error } = await supabase
        .from("actus")
        .update({
          title: data.title,
          description: data.description,
          image_url: imageUrl,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Actu mise à jour avec succès");
      queryClient.invalidateQueries({ queryKey: ["admin-actus"] });
      queryClient.invalidateQueries({ queryKey: ["actus"] });
      setEditingId(null);
      setFormData({ title: "", description: "", image_url: "" });
      setImageFile(null);
      setImagePreview(null);
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour de l'actu");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Delete image from storage
      const actu = actus?.find(a => a.id === id);
      if (actu?.image_url) {
        const imagePath = actu.image_url.split('/').pop();
        if (imagePath) {
          await supabase.storage.from('actus-images').remove([imagePath]);
        }
      }

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
    setImagePreview(actu.image_url || null);
    setImageFile(null);
    setIsCreating(true);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({ title: "", description: "", image_url: "" });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const validTypes = ['image/webp', 'image/png', 'image/jpeg', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast.error("Format d'image non supporté. Utilisez .webp, .png, .jpeg ou .gif");
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("L'image est trop grande. Maximum 5MB");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
              <Label htmlFor="image">Image (.webp, .png, .jpeg, .gif)</Label>
              <Input
                id="image"
                type="file"
                accept=".webp,.png,.jpeg,.jpg,.gif"
                onChange={handleImageChange}
              />
              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
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
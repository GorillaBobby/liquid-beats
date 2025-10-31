import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Music } from "lucide-react";

interface UploadTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess: () => void;
}

export const UploadTrackDialog = ({ open, onOpenChange, onUploadSuccess }: UploadTrackDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!user || !audioFile || !title) {
      toast({ variant: "destructive", title: "Veuillez remplir tous les champs requis" });
      return;
    }

    try {
      setUploading(true);

      // Upload audio
      const audioPath = `${user.id}/${Date.now()}_${audioFile.name}`;
      const { error: audioError } = await supabase.storage
        .from("audio-files")
        .upload(audioPath, audioFile);

      if (audioError) throw audioError;

      const { data: { publicUrl: audioUrl } } = supabase.storage
        .from("audio-files")
        .getPublicUrl(audioPath);

      // Upload cover if provided
      let coverUrl = null;
      if (coverFile) {
        const coverPath = `${user.id}/${Date.now()}_${coverFile.name}`;
        const { error: coverError } = await supabase.storage
          .from("cover-images")
          .upload(coverPath, coverFile);

        if (coverError) throw coverError;

        const { data: { publicUrl } } = supabase.storage
          .from("cover-images")
          .getPublicUrl(coverPath);
        coverUrl = publicUrl;
      }

      // Create track record
      const { error: trackError } = await supabase.from("tracks").insert({
        artist_id: user.id,
        title,
        description,
        audio_url: audioUrl,
        cover_url: coverUrl,
      });

      if (trackError) throw trackError;

      toast({
        title: "Musique ajoutée !",
        description: "Votre musique est maintenant en ligne",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setAudioFile(null);
      setCoverFile(null);
      onOpenChange(false);
      onUploadSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-glass/95 backdrop-blur-glass border-glass-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Ajouter une musique
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la musique"
              className="bg-glass/30 border-glass-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre musique..."
              className="bg-glass/30 border-glass-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audio">Fichier audio * (MP3, WAV, etc.)</Label>
            <div className="flex items-center gap-3">
              <Input
                id="audio"
                type="file"
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                className="bg-glass/30 border-glass-border"
              />
              {audioFile && <Music className="w-5 h-5 text-primary" />}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover">Image de couverture (optionnel)</Label>
            <Input
              id="cover"
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              className="bg-glass/30 border-glass-border"
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={uploading || !audioFile || !title}
            className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? "Upload en cours..." : "Publier"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

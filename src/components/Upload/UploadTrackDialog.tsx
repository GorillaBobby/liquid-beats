import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [lyrics, setLyrics] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [downloadable, setDownloadable] = useState(false);
  const [albumId, setAlbumId] = useState<string>("");
  const [albums, setAlbums] = useState<any[]>([]);
  const [createNewAlbum, setCreateNewAlbum] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");

  useEffect(() => {
    if (user) {
      loadAlbums();
    }
  }, [user]);

  const loadAlbums = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("albums")
      .select("*")
      .eq("artist_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setAlbums(data);
  };

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

      // Create album if needed
      let finalAlbumId = albumId;
      if (createNewAlbum && newAlbumTitle) {
        const { data: newAlbum, error: albumError } = await supabase
          .from("albums")
          .insert({
            artist_id: user.id,
            title: newAlbumTitle,
            cover_url: coverUrl,
          })
          .select()
          .single();

        if (albumError) throw albumError;
        finalAlbumId = newAlbum.id;
      }

      // Create track record
      const { error: trackError } = await supabase.from("tracks").insert({
        artist_id: user.id,
        title,
        description,
        audio_url: audioUrl,
        cover_url: coverUrl,
        lyrics,
        downloadable,
        album_id: finalAlbumId || null,
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
      setLyrics("");
      setDownloadable(false);
      setAlbumId("");
      setCreateNewAlbum(false);
      setNewAlbumTitle("");
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

          <div className="space-y-2">
            <Label htmlFor="lyrics">Paroles (optionnel)</Label>
            <Textarea
              id="lyrics"
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="Paroles de la musique..."
              className="bg-glass/30 border-glass-border resize-none"
              rows={6}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="downloadable"
              checked={downloadable}
              onCheckedChange={(checked) => setDownloadable(checked as boolean)}
            />
            <Label htmlFor="downloadable" className="cursor-pointer">
              Autoriser le téléchargement
            </Label>
          </div>

          <div className="space-y-2">
            <Label>Album (optionnel)</Label>
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox
                id="createNewAlbum"
                checked={createNewAlbum}
                onCheckedChange={(checked) => setCreateNewAlbum(checked as boolean)}
              />
              <Label htmlFor="createNewAlbum" className="cursor-pointer">
                Créer un nouvel album
              </Label>
            </div>
            
            {createNewAlbum ? (
              <Input
                placeholder="Titre du nouvel album"
                value={newAlbumTitle}
                onChange={(e) => setNewAlbumTitle(e.target.value)}
                className="bg-glass/30 border-glass-border"
              />
            ) : (
              <Select value={albumId} onValueChange={setAlbumId}>
                <SelectTrigger className="bg-glass/30 border-glass-border">
                  <SelectValue placeholder="Sélectionner un album" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun album (Single)</SelectItem>
                  {albums.map((album) => (
                    <SelectItem key={album.id} value={album.id}>
                      {album.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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

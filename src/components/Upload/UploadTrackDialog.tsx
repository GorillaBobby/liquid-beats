import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, Music, X } from "lucide-react";

interface UploadTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess: () => void;
}

interface TrackFile {
  file: File;
  title: string;
}

export const UploadTrackDialog = ({ open, onOpenChange, onUploadSuccess }: UploadTrackDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<"single" | "album">("single");
  
  // Single track fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [downloadable, setDownloadable] = useState(false);
  
  // Album fields
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumDescription, setAlbumDescription] = useState("");
  const [albumCoverFile, setAlbumCoverFile] = useState<File | null>(null);
  const [trackFiles, setTrackFiles] = useState<TrackFile[]>([]);

  const handleAddTrackFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).map((file) => ({
      file,
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
    }));
    setTrackFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveTrackFile = (index: number) => {
    setTrackFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateTrackTitle = (index: number, newTitle: string) => {
    setTrackFiles((prev) =>
      prev.map((track, i) => (i === index ? { ...track, title: newTitle } : track))
    );
  };

  const handleUploadSingle = async () => {
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
        lyrics,
        downloadable,
      });

      if (trackError) throw trackError;

      toast({
        title: "Musique ajoutée !",
        description: "Votre musique est maintenant en ligne",
      });

      resetForm();
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

  const handleUploadAlbum = async () => {
    if (!user || !albumTitle || trackFiles.length === 0) {
      toast({ variant: "destructive", title: "Veuillez remplir tous les champs requis" });
      return;
    }

    try {
      setUploading(true);

      // Upload album cover if provided
      let albumCoverUrl = null;
      if (albumCoverFile) {
        const coverPath = `${user.id}/${Date.now()}_${albumCoverFile.name}`;
        const { error: coverError } = await supabase.storage
          .from("cover-images")
          .upload(coverPath, albumCoverFile);

        if (coverError) throw coverError;

        const { data: { publicUrl } } = supabase.storage
          .from("cover-images")
          .getPublicUrl(coverPath);
        albumCoverUrl = publicUrl;
      }

      // Create album
      const { data: album, error: albumError } = await supabase
        .from("albums")
        .insert({
          artist_id: user.id,
          title: albumTitle,
          description: albumDescription,
          cover_url: albumCoverUrl,
        })
        .select()
        .single();

      if (albumError) throw albumError;

      // Upload all tracks
      for (const trackFile of trackFiles) {
        const audioPath = `${user.id}/${Date.now()}_${trackFile.file.name}`;
        const { error: audioError } = await supabase.storage
          .from("audio-files")
          .upload(audioPath, trackFile.file);

        if (audioError) throw audioError;

        const { data: { publicUrl: audioUrl } } = supabase.storage
          .from("audio-files")
          .getPublicUrl(audioPath);

        // Create track record
        const { error: trackError } = await supabase.from("tracks").insert({
          artist_id: user.id,
          title: trackFile.title,
          audio_url: audioUrl,
          cover_url: albumCoverUrl,
          album_id: album.id,
          downloadable,
        });

        if (trackError) throw trackError;
      }

      toast({
        title: "Album créé !",
        description: `Votre album avec ${trackFiles.length} musiques est maintenant en ligne`,
      });

      resetForm();
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

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setAudioFile(null);
    setCoverFile(null);
    setLyrics("");
    setDownloadable(false);
    setAlbumTitle("");
    setAlbumDescription("");
    setAlbumCoverFile(null);
    setTrackFiles([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-glass/95 backdrop-blur-glass border-glass-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Ajouter une musique
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Type d'upload</Label>
            <RadioGroup value={uploadType} onValueChange={(value: any) => setUploadType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single" className="cursor-pointer">Single</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="album" id="album" />
                <Label htmlFor="album" className="cursor-pointer">Album</Label>
              </div>
            </RadioGroup>
          </div>

          {uploadType === "single" ? (
            <>
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

              <Button
                onClick={handleUploadSingle}
                disabled={uploading || !audioFile || !title}
                className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Upload en cours..." : "Publier"}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="albumTitle">Titre de l'album *</Label>
                <Input
                  id="albumTitle"
                  value={albumTitle}
                  onChange={(e) => setAlbumTitle(e.target.value)}
                  placeholder="Titre de l'album"
                  className="bg-glass/30 border-glass-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="albumDescription">Description de l'album</Label>
                <Textarea
                  id="albumDescription"
                  value={albumDescription}
                  onChange={(e) => setAlbumDescription(e.target.value)}
                  placeholder="Décrivez votre album..."
                  className="bg-glass/30 border-glass-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="albumCover">Image de couverture de l'album</Label>
                <Input
                  id="albumCover"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAlbumCoverFile(e.target.files?.[0] || null)}
                  className="bg-glass/30 border-glass-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trackFiles">Fichiers audio * (MP3, WAV, etc.)</Label>
                <Input
                  id="trackFiles"
                  type="file"
                  accept="audio/*"
                  multiple
                  onChange={(e) => handleAddTrackFiles(e.target.files)}
                  className="bg-glass/30 border-glass-border"
                />
              </div>

              {trackFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Musiques de l'album ({trackFiles.length})</Label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {trackFiles.map((track, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-glass/30 rounded-lg">
                        <Music className="w-4 h-4 text-primary flex-shrink-0" />
                        <Input
                          value={track.title}
                          onChange={(e) => handleUpdateTrackTitle(index, e.target.value)}
                          placeholder="Titre de la musique"
                          className="bg-glass/50 border-glass-border flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveTrackFile(index)}
                          className="flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="albumDownloadable"
                  checked={downloadable}
                  onCheckedChange={(checked) => setDownloadable(checked as boolean)}
                />
                <Label htmlFor="albumDownloadable" className="cursor-pointer">
                  Autoriser le téléchargement pour toutes les musiques
                </Label>
              </div>

              <Button
                onClick={handleUploadAlbum}
                disabled={uploading || !albumTitle || trackFiles.length === 0}
                className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Upload en cours..." : `Publier l'album (${trackFiles.length} musiques)`}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
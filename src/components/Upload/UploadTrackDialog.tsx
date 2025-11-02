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
  duration?: number;
}

const MAX_DURATION_SECONDS = 1200; // 20 minutes

const validateAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    });
    
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error('Impossible de lire le fichier audio'));
    });
    
    audio.src = url;
  });
};

export const UploadTrackDialog = ({ open, onOpenChange, onUploadSuccess }: UploadTrackDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<"single" | "album">("single");
  
  // Single track fields
  const [title, setTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [description, setDescription] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [downloadable, setDownloadable] = useState(false);
  
  // Album fields
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumArtistName, setAlbumArtistName] = useState("");
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
    if (!user || !audioFile || !title || !artistName) {
      toast({ variant: "destructive", title: "Veuillez remplir tous les champs requis" });
      return;
    }

    try {
      setUploading(true);

      // Validate audio duration
      const duration = await validateAudioDuration(audioFile);
      if (duration > MAX_DURATION_SECONDS) {
        toast({
          variant: "destructive",
          title: "Durée trop longue",
          description: `La musique ne doit pas dépasser 20 minutes. Durée actuelle: ${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}`
        });
        setUploading(false);
        return;
      }

      // Upload audio without compression - preserves original quality
      const audioPath = `${user.id}/${Date.now()}_${audioFile.name}`;
      const { error: audioError } = await supabase.storage
        .from("audio-files")
        .upload(audioPath, audioFile, {
          contentType: audioFile.type, // Preserves original format (FLAC, WAV, etc.)
          cacheControl: '3600',
          upsert: false
        });

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
    if (!user || !albumTitle || !albumArtistName || trackFiles.length === 0) {
      toast({ variant: "destructive", title: "Veuillez remplir tous les champs requis" });
      return;
    }

    try {
      setUploading(true);

      // Validate all track durations before uploading
      for (let i = 0; i < trackFiles.length; i++) {
        const track = trackFiles[i];
        try {
          const duration = await validateAudioDuration(track.file);
          if (duration > MAX_DURATION_SECONDS) {
            toast({
              variant: "destructive",
              title: "Durée trop longue",
              description: `La musique "${track.title}" ne doit pas dépasser 20 minutes. Durée: ${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}`
            });
            setUploading(false);
            return;
          }
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Erreur de validation",
            description: `Impossible de valider la durée de "${track.title}"`
          });
          setUploading(false);
          return;
        }
      }

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

      // Upload all tracks without compression - preserves original quality
      let uploadedCount = 0;
      for (const trackFile of trackFiles) {
        try {
          const audioPath = `${user.id}/${Date.now()}_${trackFile.file.name}`;
          const { error: audioError } = await supabase.storage
            .from("audio-files")
            .upload(audioPath, trackFile.file, {
              contentType: trackFile.file.type, // Preserves original format (FLAC, WAV, etc.)
              cacheControl: '3600',
              upsert: false
            });

          if (audioError) throw new Error(`Erreur upload "${trackFile.title}": ${audioError.message}`);

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

          if (trackError) throw new Error(`Erreur création track "${trackFile.title}": ${trackError.message}`);
          
          uploadedCount++;
        } catch (error: any) {
          // Clean up album if track upload fails
          await supabase.from("albums").delete().eq("id", album.id);
          throw new Error(`${error.message}. Album non créé.`);
        }
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
    setArtistName("");
    setDescription("");
    setAudioFile(null);
    setCoverFile(null);
    setLyrics("");
    setDownloadable(false);
    setAlbumTitle("");
    setAlbumArtistName("");
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
                <Label htmlFor="artistName">Nom de l'artiste *</Label>
                <Input
                  id="artistName"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="Nom de l'artiste"
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
                <Label htmlFor="audio">Fichier audio * (MP3, FLAC, WAV, ALAC, AIFF, etc.)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="audio"
                    type="file"
                    accept="audio/*,.flac,.wav,.alac,.aiff,.ape,.wv,.m4a"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    className="bg-glass/30 border-glass-border"
                  />
                  {audioFile && <Music className="w-5 h-5 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  Formats lossless recommandés : FLAC, WAV, ALAC, AIFF pour une qualité maximale
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cover">Image de couverture (PNG, JPEG, WEBP, etc.)</Label>
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
                disabled={uploading || !audioFile || !title || !artistName}
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
                <Label htmlFor="albumArtistName">Nom de l'artiste *</Label>
                <Input
                  id="albumArtistName"
                  value={albumArtistName}
                  onChange={(e) => setAlbumArtistName(e.target.value)}
                  placeholder="Nom de l'artiste"
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
                <Label htmlFor="albumCover">Image de couverture de l'album (PNG, JPEG, WEBP, etc.)</Label>
                <Input
                  id="albumCover"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAlbumCoverFile(e.target.files?.[0] || null)}
                  className="bg-glass/30 border-glass-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trackFiles">Fichiers audio * (MP3, FLAC, WAV, ALAC, AIFF, etc.)</Label>
                <Input
                  id="trackFiles"
                  type="file"
                  accept="audio/*,.flac,.wav,.alac,.aiff,.ape,.wv,.m4a"
                  multiple
                  onChange={(e) => handleAddTrackFiles(e.target.files)}
                  className="bg-glass/30 border-glass-border"
                />
                <p className="text-xs text-muted-foreground">
                  Formats lossless recommandés : FLAC, WAV, ALAC, AIFF pour une qualité maximale
                </p>
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
                disabled={uploading || !albumTitle || !albumArtistName || trackFiles.length === 0}
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
import { Play, Plus, Download, Trash2, Share2 } from "lucide-react";
import { useState, memo } from "react";
import { AddToPlaylistDialog } from "@/components/Track/AddToPlaylistDialog";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import defaultCover from "@/assets/default-cover.png";

interface TrackCardProps {
  id?: string;
  title: string;
  artist: string;
  cover: string;
  audioUrl?: string;
  onClick: () => void;
  onPlay?: () => void;
  lyrics?: string;
  downloadable?: boolean;
  artistId?: string;
  onDelete?: () => void;
}

const TrackCardComponent = ({ id, title, artist, cover, audioUrl, onClick, onPlay, lyrics, downloadable, artistId, onDelete }: TrackCardProps) => {
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlay) {
      onPlay();
    } else {
      onClick();
    }
    
    // Increment play count
    if (id && audioUrl) {
      supabase.rpc("increment_track_plays", { track_id: id });
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioUrl) return;

    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Téléchargement démarré",
        description: `${title} est en cours de téléchargement`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de télécharger cette musique",
      });
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette musique ?")) return;

    try {
      const { error } = await supabase.from("tracks").delete().eq("id", id);
      if (error) throw error;

      toast({
        title: "Musique supprimée",
        description: "La musique a été retirée",
      });

      if (onDelete) onDelete();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/track/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Lien copié",
        description: "Le lien de cette musique a été copié dans le presse-papier",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de copier le lien",
      });
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // If clicking on a button, don't navigate
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/track/${id}`);
  };

  return (
    <>
      <div
        className="group relative bg-glass/50 backdrop-blur-glass rounded-2xl p-4 border border-glass-border hover:bg-glass-hover transition-all duration-300 cursor-pointer animate-fade-in"
        onClick={handleCardClick}
      >
        <div className="relative aspect-square rounded-xl overflow-hidden mb-4 shadow-glass">
          <OptimizedImage
            src={cover || defaultCover}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Button
              size="icon"
              className="w-14 h-14 bg-gradient-primary shadow-glow hover:scale-110 transition-transform"
              onClick={handlePlayClick}
            >
              <Play className="w-6 h-6 ml-0.5" />
            </Button>
          </div>
        </div>
        
        <h3 className="font-semibold text-foreground truncate mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground truncate">{artist}</p>

        <div className="flex gap-2 mt-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              setPlaylistDialogOpen(true);
            }}
            variant="ghost"
            size="sm"
            className="flex-1 text-muted-foreground hover:text-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Playlist
          </Button>
          
          <Button
            onClick={handleShare}
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground h-9 w-9"
          >
            <Share2 className="w-4 h-4" />
          </Button>
          
          {downloadable && (
            <Button
              onClick={handleDownload}
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground h-9 w-9"
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
          
          {user?.id === artistId && (
            <Button
              onClick={handleDelete}
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive h-9 w-9"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {id && (
        <AddToPlaylistDialog
          open={playlistDialogOpen}
          onOpenChange={setPlaylistDialogOpen}
          trackId={id}
        />
      )}
    </>
  );
};

// Memoize component to prevent unnecessary re-renders
export const TrackCard = memo(TrackCardComponent);

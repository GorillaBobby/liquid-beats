import { Disc3, Music, Trash2, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import defaultCover from "@/assets/default-cover.png";
import verifiedNormal from "@/assets/verified-normal.png";
import verifiedGold from "@/assets/verified-gold.png";

interface AlbumCardProps {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  trackCount: number;
  artistId?: string;
  artistVerified?: boolean;
  artistVerifiedTier?: string | null;
  onDelete?: () => void;
}

const AlbumCardComponent = ({ id, title, artist, coverUrl, trackCount, artistId, artistVerified, artistVerifiedTier, onDelete }: AlbumCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/album/${id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Découvrez l'album "${title}" de ${artist}`,
          url: shareUrl,
        });
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Error sharing:", error);
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Lien copié",
        description: "Le lien de l'album a été copié dans le presse-papier",
      });
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'album "${title}" ? Les musiques seront transformées en singles.`)) return;

    try {
      // Transform album tracks to singles (set album_id to null)
      const { error: tracksError } = await supabase
        .from("tracks")
        .update({ album_id: null })
        .eq("album_id", id);

      if (tracksError) throw tracksError;

      // Delete the album
      const { error: albumError } = await supabase
        .from("albums")
        .delete()
        .eq("id", id);

      if (albumError) throw albumError;

      toast({
        title: "Album supprimé",
        description: "L'album a été supprimé et les musiques transformées en singles",
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

  return (
    <div
      onClick={() => navigate(`/album/${id}`)}
      className="group relative bg-glass/50 backdrop-blur-glass rounded-2xl p-4 border border-glass-border hover:bg-glass-hover transition-all duration-300 cursor-pointer animate-fade-in"
    >
      <div className="relative aspect-square rounded-xl overflow-hidden mb-4 shadow-glass">
        <OptimizedImage
          src={coverUrl || defaultCover}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Disc3 className="w-14 h-14 text-primary-foreground" />
        </div>
      </div>
      
      <h3 className="font-semibold text-foreground truncate mb-1">{title}</h3>
      <div className="flex items-center gap-1 mb-1">
        <p className="text-sm text-muted-foreground truncate">{artist}</p>
        {artistVerified && (
          <img 
            src={artistVerifiedTier === "gold" ? verifiedGold : verifiedNormal} 
            alt="Vérifié" 
            className="w-4 h-4 flex-shrink-0" 
          />
        )}
      </div>
      
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Music className="w-3 h-3" />
          <span>{trackCount} {trackCount > 1 ? "titres" : "titre"}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            onClick={handleShare}
            variant="ghost"
            size="sm"
            className="h-auto p-1"
          >
            <Share2 className="w-4 h-4" />
          </Button>
          
          {user?.id === artistId && (
            <Button
              onClick={handleDelete}
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive h-auto p-1"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export const AlbumCard = memo(AlbumCardComponent);

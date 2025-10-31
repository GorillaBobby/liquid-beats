import { Play, Plus } from "lucide-react";
import { useState } from "react";
import { AddToPlaylistDialog } from "@/components/Track/AddToPlaylistDialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface TrackCardProps {
  id?: string;
  title: string;
  artist: string;
  cover: string;
  audioUrl?: string;
  onClick: () => void;
  onPlay?: () => void;
  lyrics?: string;
}

export const TrackCard = ({ id, title, artist, cover, audioUrl, onClick, onPlay, lyrics }: TrackCardProps) => {
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);

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

  return (
    <>
      <div
        className="group relative bg-glass/50 backdrop-blur-glass rounded-2xl p-4 border border-glass-border hover:bg-glass-hover transition-all duration-300 cursor-pointer animate-fade-in"
        onClick={onClick}
      >
        <div className="relative aspect-square rounded-xl overflow-hidden mb-4 shadow-glass">
          <img
            src={cover}
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

        <Button
          onClick={(e) => {
            e.stopPropagation();
            setPlaylistDialogOpen(true);
          }}
          variant="ghost"
          size="sm"
          className="w-full mt-2 text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter à une playlist
        </Button>
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

import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrackCardProps {
  title: string;
  artist: string;
  cover: string;
  onClick: () => void;
}

export const TrackCard = ({ title, artist, cover, onClick }: TrackCardProps) => {
  return (
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
          >
            <Play className="w-6 h-6 ml-0.5" />
          </Button>
        </div>
      </div>
      
      <h3 className="font-semibold text-foreground truncate mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground truncate">{artist}</p>
    </div>
  );
};

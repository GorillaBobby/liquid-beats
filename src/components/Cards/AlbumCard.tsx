import { Disc3, Music } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AlbumCardProps {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  trackCount: number;
}

export const AlbumCard = ({ id, title, artist, coverUrl, trackCount }: AlbumCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/album/${id}`)}
      className="group relative bg-glass/50 backdrop-blur-glass rounded-2xl p-4 border border-glass-border hover:bg-glass-hover transition-all duration-300 cursor-pointer animate-fade-in"
    >
      <div className="relative aspect-square rounded-xl overflow-hidden mb-4 shadow-glass">
        <img
          src={coverUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop"}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Disc3 className="w-14 h-14 text-primary-foreground" />
        </div>
      </div>
      
      <h3 className="font-semibold text-foreground truncate mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground truncate">{artist}</p>
      
      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
        <Music className="w-3 h-3" />
        <span>{trackCount} {trackCount > 1 ? "titres" : "titre"}</span>
      </div>
    </div>
  );
};

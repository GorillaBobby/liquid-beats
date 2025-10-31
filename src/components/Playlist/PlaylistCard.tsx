import { Music, Lock } from "lucide-react";

interface PlaylistCardProps {
  playlist: {
    id: string;
    name: string;
    description: string | null;
    cover_url: string | null;
    is_public: boolean;
    track_count: number;
  };
  onClick: () => void;
}

export const PlaylistCard = ({ playlist, onClick }: PlaylistCardProps) => {
  return (
    <div
      className="group bg-glass/50 backdrop-blur-glass rounded-2xl p-4 border border-glass-border hover:bg-glass-hover transition-all duration-300 cursor-pointer animate-fade-in"
      onClick={onClick}
    >
      <div className="relative aspect-square rounded-xl overflow-hidden mb-4 shadow-glass bg-glass/30 flex items-center justify-center">
        {playlist.cover_url ? (
          <img
            src={playlist.cover_url}
            alt={playlist.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <Music className="w-16 h-16 text-muted-foreground" />
        )}
        {!playlist.is_public && (
          <div className="absolute top-2 right-2 bg-glass/80 backdrop-blur-sm rounded-full p-2">
            <Lock className="w-4 h-4 text-foreground" />
          </div>
        )}
      </div>

      <h3 className="font-semibold text-foreground truncate mb-1">{playlist.name}</h3>
      {playlist.description && (
        <p className="text-sm text-muted-foreground truncate mb-2">{playlist.description}</p>
      )}
      <p className="text-xs text-muted-foreground">
        {playlist.track_count} {playlist.track_count > 1 ? "morceaux" : "morceau"}
      </p>
    </div>
  );
};

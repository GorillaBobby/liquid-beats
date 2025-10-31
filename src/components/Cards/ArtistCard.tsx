import { Button } from "@/components/ui/button";
import { UserPlus, CheckCircle } from "lucide-react";

interface ArtistCardProps {
  name: string;
  genre: string;
  image: string;
  followers: string;
  verified?: boolean;
  onClick: () => void;
}

export const ArtistCard = ({ name, genre, image, followers, verified, onClick }: ArtistCardProps) => {
  return (
    <div
      className="group bg-glass/50 backdrop-blur-glass rounded-2xl p-6 border border-glass-border hover:bg-glass-hover transition-all duration-300 cursor-pointer animate-fade-in"
      onClick={onClick}
    >
      <div className="relative w-32 h-32 mx-auto mb-4">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover rounded-full shadow-glass transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 rounded-full bg-gradient-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <div className="flex items-center justify-center gap-2 mb-1">
        <h3 className="font-semibold text-foreground text-center">{name}</h3>
        {verified && <CheckCircle className="w-4 h-4 text-primary fill-primary" />}
      </div>
      <p className="text-sm text-muted-foreground text-center mb-1">{genre}</p>
      <p className="text-xs text-muted-foreground text-center mb-4">{followers} abonnés</p>
      
      <Button
        variant="outline"
        size="sm"
        className="w-full bg-glass/30 border-glass-border hover:bg-gradient-primary hover:border-primary hover:text-primary-foreground transition-all duration-300"
      >
        <UserPlus className="w-4 h-4 mr-2" />
        Suivre
      </Button>
    </div>
  );
};

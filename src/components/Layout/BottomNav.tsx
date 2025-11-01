import { Home, TrendingUp, Search, ListMusic, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const mainNavigation = [
  { name: "Accueil", href: "/", icon: Home },
  { name: "Tendances", href: "/trending", icon: TrendingUp },
  { name: "Recherche", href: "/search", icon: Search },
  { name: "Playlists", href: "/playlists", icon: ListMusic },
  { name: "Profil", href: "/profile", icon: User },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-glass/95 backdrop-blur-glass border-t border-glass-border z-50 flex items-center justify-around px-2 safe-area-inset-bottom"
    >
      {mainNavigation.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 min-w-[60px]",
              isActive
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <item.icon className={cn(
              "w-6 h-6 transition-all duration-300",
              isActive && "scale-110"
            )} />
            <span className={cn(
              "text-[10px] font-medium transition-all duration-300",
              isActive && "font-semibold"
            )}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

import { Home, TrendingUp, Radio, ListMusic, User, Search, Inbox, Shield } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const navigation = [
  { name: "Découvrir", href: "/", icon: Home },
  { name: "Tendances", href: "/trending", icon: TrendingUp },
  { name: "Mon fil", href: "/feed", icon: Radio },
  { name: "Rechercher", href: "/search", icon: Search },
  { name: "Playlists", href: "/playlists", icon: ListMusic },
  { name: "Messages", href: "/messages-inbox", icon: Inbox },
  { name: "Profil", href: "/profile", icon: User },
];

export const Sidebar = () => {
  const location = useLocation();
  const { isAdmin } = useIsAdmin();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 p-6 bg-glass/50 backdrop-blur-glass border-r border-glass-border z-40">
      <div className="mb-8">
        <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          LiquidBeats
        </h1>
      </div>
      
      <nav className="space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                isActive
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-glass-hover hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
        
        {isAdmin && (
          <Link
            to="/admin"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
              location.pathname === "/admin"
                ? "bg-gradient-primary text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:bg-glass-hover hover:text-foreground"
            )}
          >
            <Shield className="w-5 h-5" />
            <span className="font-medium">Admin</span>
          </Link>
        )}
      </nav>
    </aside>
  );
};

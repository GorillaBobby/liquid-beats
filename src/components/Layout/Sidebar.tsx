import { Home, TrendingUp, Radio, ListMusic, User, Search, Inbox, Shield, Disc3, MessageSquare, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { FeedbackDialog } from "@/components/Feedback/FeedbackDialog";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Découvrir", href: "/", icon: Home },
  { name: "Tendances", href: "/trending", icon: TrendingUp },
  { name: "Mon fil", href: "/feed", icon: Radio },
  { name: "Rechercher", href: "/search", icon: Search },
  { name: "Playlists", href: "/playlists", icon: ListMusic },
  { name: "Albums", href: "/albums", icon: Disc3 },
  { name: "Messages", href: "/messages-inbox", icon: Inbox },
  { name: "Profil", href: "/profile", icon: User },
  { name: "Admin", href: "/admin", icon: Shield },
];

export const Sidebar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setUserEmail(user.email || null);
      loadUnreadCount();
      
      const channel = supabase
        .channel('sidebar-messages')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
          loadUnreadCount();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadUnreadCount = async () => {
    if (!user) return;
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .eq("read", false);
    setUnreadCount(count || 0);
  };

  // Filter navigation based on user email for admin access
  const filteredNavigation = navigation.filter((item) => {
    if (item.name === "Admin") {
      return userEmail === "certitudemp3@gmail.com";
    }
    return true;
  });

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col bg-glass/50 backdrop-blur-glass border-r border-glass-border z-40">
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            LiquidBeats
          </h1>
        </div>
        
        <nav className="space-y-2">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative",
                  isActive
                    ? "bg-gradient-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:bg-glass-hover hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
                {item.name === "Messages" && unreadCount > 0 && (
                  <span className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
          
          <div className="pt-4 border-t border-glass-border mt-4">
            <FeedbackDialog />
          </div>
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-glass-border">
        <Button
          onClick={signOut}
          variant="outline"
          className="w-full bg-glass/30 border-glass-border hover:bg-glass/50 transition-all duration-300"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </aside>
  );
};

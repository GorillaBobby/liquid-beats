import { useState } from "react";
import { Menu, Home, TrendingUp, Radio, ListMusic, User, Search, Inbox, Shield, Disc3 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export const MobileNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setUserEmail(user.email || null);
      loadUnreadCount();
      
      const channel = supabase
        .channel('mobile-messages')
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

  const filteredNavigation = navigation.filter((item) => {
    if (item.name === "Admin") {
      return userEmail === "certitudemp3@gmail.com";
    }
    return true;
  });

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-glass/50 backdrop-blur-glass border-b border-glass-border z-50 flex items-center justify-between px-4">
      <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
        LiquidBeats
      </h1>
      
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Menu
            </DrawerTitle>
          </DrawerHeader>
          <nav className="p-4 space-y-2">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <DrawerClose asChild key={item.name}>
                  <Link
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
                </DrawerClose>
              );
            })}
          </nav>
        </DrawerContent>
      </Drawer>
    </header>
  );
};

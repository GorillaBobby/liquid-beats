import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export const NotificationsPanel = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();

      const channel = supabase
        .channel('notifications-panel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
          loadNotifications();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setNotifications(data);
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
    loadNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="icon"
        className="fixed top-4 right-4 z-50 bg-glass/50 backdrop-blur-glass border border-glass-border"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
            {unreadCount}
          </span>
        )}
      </Button>
    );
  }

  return (
    <div className="fixed top-0 right-0 h-screen w-80 bg-glass/95 backdrop-blur-glass border-l border-glass-border z-50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
        </h2>
        <Button onClick={() => setIsOpen(false)} variant="ghost" size="icon">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-80px)]">
        {notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.read && markAsRead(notif.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  notif.read
                    ? "bg-glass/30 border-glass-border"
                    : "bg-primary/10 border-primary"
                }`}
              >
                <h3 className="font-semibold text-sm mb-1">{notif.title}</h3>
                <p className="text-xs text-muted-foreground">{notif.message}</p>
                <span className="text-xs text-muted-foreground mt-1 block">
                  {new Date(notif.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Aucune notification</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

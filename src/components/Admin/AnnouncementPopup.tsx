import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Announcement {
  id: string;
  title: string;
  description: string;
  is_active: boolean;
}

export const AnnouncementPopup = () => {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadActiveAnnouncement();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("admin_announcements_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "admin_announcements",
        },
        () => {
          loadActiveAnnouncement();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadActiveAnnouncement = async () => {
    const { data, error } = await supabase
      .from("admin_announcements")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setAnnouncement(data);
      setOpen(true);
    } else {
      setAnnouncement(null);
      setOpen(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  if (!announcement) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-glass/95 backdrop-blur-glass border-glass-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {announcement.title}
          </DialogTitle>
          <DialogDescription className="text-foreground text-base mt-4">
            {announcement.description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end mt-4">
          <Button
            onClick={handleClose}
            className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
          >
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
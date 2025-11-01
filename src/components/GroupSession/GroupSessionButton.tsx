import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGroupSession } from "@/hooks/useGroupSession";
import { Badge } from "@/components/ui/badge";

export default function GroupSessionButton() {
  const { currentSession, isChatOpen, setIsChatOpen, leaveSession, participants, chatMessages } = useGroupSession();

  if (!currentSession) return null;

  const unreadCount = 0; // Could be enhanced to track unread messages

  return (
    <div className="fixed top-20 right-4 flex items-center gap-2 z-50 animate-slide-in-right">
      <div className="bg-glass/95 backdrop-blur-glass border border-glass-border rounded-lg p-2 flex items-center gap-2 shadow-glass">
        <span className="text-sm font-medium px-2">
          Session: {currentSession.session_code}
        </span>
        
        <Button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`bg-gradient-primary hover:shadow-glow transition-all relative ${isChatOpen ? 'ring-2 ring-primary' : ''}`}
          size="icon"
          title={isChatOpen ? "Fermer le chat" : "Ouvrir le chat"}
        >
          <MessageCircle className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-destructive">
              {unreadCount}
            </Badge>
          )}
        </Button>
        
        <Button
          onClick={leaveSession}
          variant="destructive"
          size="icon"
          title="Quitter la session"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

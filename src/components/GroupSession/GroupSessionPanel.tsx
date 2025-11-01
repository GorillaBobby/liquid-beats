import { useState } from "react";
import { Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useGroupSession } from "@/hooks/useGroupSession";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const REACTIONS = ["👍", "❤️", "🔥", "😂", "🎵", "🎉"];

export default function GroupSessionPanel() {
  const {
    currentSession,
    participants,
    chatMessages,
    isHost,
    isChatOpen,
    leaveSession,
    sendMessage,
    sendReaction
  } = useGroupSession();

  const [message, setMessage] = useState("");

  if (!currentSession || !isChatOpen) return null;

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessage(message);
    setMessage("");
  };

  return (
    <div className="fixed top-32 right-4 w-80 h-[calc(100vh-220px)] bg-glass/95 backdrop-blur-glass border border-glass-border rounded-lg shadow-glass flex flex-col z-40 animate-slide-in-right">
      {/* Header */}
      <div className="p-4 border-b border-glass-border">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <div>
            <p className="font-semibold text-sm">Session d'écoute</p>
            <p className="text-xs text-muted-foreground">
              Code: {currentSession.session_code}
            </p>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="p-3 border-b border-glass-border">
        <p className="text-xs text-muted-foreground mb-2">
          {participants.length} participant{participants.length > 1 ? "s" : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          {participants.map((participant) => (
            <div key={participant.id} className="flex items-center gap-1.5">
              <Avatar className="w-6 h-6">
                <AvatarImage src={participant.profiles?.avatar_url} />
                <AvatarFallback className="text-xs">
                  {participant.profiles?.username?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">{participant.profiles?.username}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {chatMessages.map((msg) => (
            <div key={msg.id} className="space-y-1">
              {msg.message && (
                <div className="flex items-start gap-2">
                  <Avatar className="w-6 h-6 mt-0.5">
                    <AvatarImage src={msg.profiles?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {msg.profiles?.username?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">
                      {msg.profiles?.username}
                    </p>
                    <p className="text-sm break-words">{msg.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(msg.created_at), {
                        addSuffix: true,
                        locale: fr
                      })}
                    </p>
                  </div>
                </div>
              )}
              {msg.reaction && (
                <div className="flex items-center gap-2 pl-2 py-1">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={msg.profiles?.avatar_url} />
                    <AvatarFallback className="text-[8px]">
                      {msg.profiles?.username?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-2xl animate-bounce-subtle">{msg.reaction}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-glass-border">
        <div className="mb-2 flex gap-1 flex-wrap">
          {REACTIONS.map((reaction) => (
            <Button
              key={reaction}
              variant="ghost"
              size="sm"
              onClick={() => sendReaction(reaction)}
              className="text-xl p-2 h-auto hover:scale-125 transition-transform"
            >
              {reaction}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="shrink-0 bg-gradient-primary"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

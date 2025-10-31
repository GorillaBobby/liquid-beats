import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  recipient_id: string;
}

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export default function Messages() {
  const { username } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipient, setRecipient] = useState<Profile | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadRecipient();
    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (
            (newMsg.sender_id === user.id && newMsg.recipient_id === recipient?.id) ||
            (newMsg.sender_id === recipient?.id && newMsg.recipient_id === user.id)
          ) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, username, recipient]);

  const loadRecipient = async () => {
    if (!username) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();

    if (error || !data) {
      toast({ variant: "destructive", title: "Utilisateur non trouvé" });
      return;
    }

    setRecipient(data);
  };

  const loadMessages = async () => {
    if (!user || !recipient) return;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .or(`sender_id.eq.${recipient.id},recipient_id.eq.${recipient.id}`)
      .order("created_at", { ascending: true });

    if (data) {
      const filteredMessages = data.filter(
        (msg) =>
          (msg.sender_id === user.id && msg.recipient_id === recipient.id) ||
          (msg.sender_id === recipient.id && msg.recipient_id === user.id)
      );
      setMessages(filteredMessages);
    }
  };

  const handleSend = async () => {
    if (!user || !recipient || !newMessage.trim()) return;

    try {
      setSending(true);
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        recipient_id: recipient.id,
        content: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    } finally {
      setSending(false);
    }
  };

  if (!recipient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        Chargement...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-glass/50 backdrop-blur-glass rounded-3xl border border-glass-border shadow-glass overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-glass-border">
              <div className="flex items-center gap-4">
                <img
                  src={recipient.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop"}
                  alt={recipient.display_name || recipient.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {recipient.display_name || recipient.username}
                  </h2>
                  <p className="text-sm text-muted-foreground">@{recipient.username}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="h-[500px] overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => {
                const isSent = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-2xl ${
                        isSent
                          ? "bg-gradient-primary text-primary-foreground"
                          : "bg-glass/50 text-foreground"
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div className="p-6 border-t border-glass-border">
              <div className="flex gap-3">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Écrivez un message..."
                  className="bg-glass/30 border-glass-border"
                />
                <Button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

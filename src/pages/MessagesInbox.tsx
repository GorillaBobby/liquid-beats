import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { MessageCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Conversation {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export default function MessagesInbox() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      loadConversations();
      
      // Real-time updates
      const channel = supabase
        .channel('messages-inbox')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
          loadConversations();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, authLoading]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data: messages } = await supabase
        .from("messages")
        .select("*, sender:profiles!messages_sender_id_fkey(id, username, display_name, avatar_url), recipient:profiles!messages_recipient_id_fkey(id, username, display_name, avatar_url)")
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (messages) {
        const conversationsMap = new Map<string, Conversation>();

        messages.forEach((msg: any) => {
          const isReceived = msg.recipient_id === user.id;
          const otherUser = isReceived ? msg.sender : msg.recipient;
          const userId = otherUser.id;

          if (!conversationsMap.has(userId)) {
            conversationsMap.set(userId, {
              user_id: userId,
              username: otherUser.username,
              display_name: otherUser.display_name,
              avatar_url: otherUser.avatar_url,
              last_message: msg.content,
              last_message_time: msg.created_at,
              unread_count: 0,
            });
          }

          if (isReceived && !msg.read) {
            const conv = conversationsMap.get(userId)!;
            conv.unread_count++;
          }
        });

        setConversations(Array.from(conversationsMap.values()));
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="md:ml-64 p-4 md:p-8 pb-32">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          size="icon"
          className="mb-4 md:hidden"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
              <MessageCircle className="w-8 h-8" />
              Messages
            </h1>
            <p className="text-muted-foreground">Vos conversations</p>
          </div>

          {conversations.length > 0 ? (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.user_id}
                  onClick={() => navigate(`/messages/${conv.username}`)}
                  className="bg-glass/50 backdrop-blur-glass rounded-2xl p-6 border border-glass-border hover:bg-glass/70 transition-all cursor-pointer flex items-center gap-4"
                >
                  <img
                    src={conv.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop"}
                    alt={conv.display_name || conv.username}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-foreground truncate">
                        {conv.display_name || conv.username}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {new Date(conv.last_message_time).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
                  </div>
                  {conv.unread_count > 0 && (
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      {conv.unread_count}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground text-lg">Aucune conversation</p>
              <p className="text-sm text-muted-foreground mt-2">
                Envoyez un message à un artiste pour démarrer une conversation
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

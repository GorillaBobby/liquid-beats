import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ActusReactionsProps {
  actusId: string;
}

const QUICK_EMOJIS = ["❤️", "🔥", "👏", "😍", "🎵", "💯"];

interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

export function ActusReactions({ actusId }: ActusReactionsProps) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReactions();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`actus-reactions-${actusId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'actus_reactions',
          filter: `actus_id=eq.${actusId}`
        },
        () => {
          loadReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [actusId, user]);

  const loadReactions = async () => {
    try {
      const { data, error } = await supabase
        .from("actus_reactions")
        .select("emoji, user_id")
        .eq("actus_id", actusId);

      if (error) throw error;

      // Group reactions by emoji
      const reactionMap = new Map<string, { count: number; userReacted: boolean }>();
      
      QUICK_EMOJIS.forEach(emoji => {
        reactionMap.set(emoji, { count: 0, userReacted: false });
      });

      data?.forEach(reaction => {
        const existing = reactionMap.get(reaction.emoji) || { count: 0, userReacted: false };
        reactionMap.set(reaction.emoji, {
          count: existing.count + 1,
          userReacted: existing.userReacted || (user ? reaction.user_id === user.id : false)
        });
      });

      const reactionsArray = Array.from(reactionMap.entries()).map(([emoji, data]) => ({
        emoji,
        count: data.count,
        userReacted: data.userReacted
      }));

      setReactions(reactionsArray);
    } catch (error) {
      console.error("Error loading reactions:", error);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!user) {
      toast.error("Connectez-vous pour réagir");
      return;
    }

    setLoading(true);

    try {
      const reaction = reactions.find(r => r.emoji === emoji);
      
      if (reaction?.userReacted) {
        // Remove reaction
        const { error } = await supabase
          .from("actus_reactions")
          .delete()
          .eq("actus_id", actusId)
          .eq("user_id", user.id)
          .eq("emoji", emoji);

        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase
          .from("actus_reactions")
          .insert({
            actus_id: actusId,
            user_id: user.id,
            emoji
          });

        if (error) throw error;
      }
    } catch (error: any) {
      console.error("Error toggling reaction:", error);
      toast.error("Erreur lors de la réaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 pt-4 border-t border-glass-border">
      {reactions.map((reaction) => (
        <Button
          key={reaction.emoji}
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => handleReaction(reaction.emoji)}
          className={cn(
            "rounded-full px-3 py-1 h-auto transition-all duration-200",
            "bg-glass/30 border-glass-border hover:bg-glass-hover",
            reaction.userReacted && "bg-primary/20 border-primary hover:bg-primary/30",
            reaction.count > 0 ? "opacity-100" : "opacity-60"
          )}
        >
          <span className="text-lg mr-1">{reaction.emoji}</span>
          {reaction.count > 0 && (
            <span className={cn(
              "text-xs font-medium",
              reaction.userReacted ? "text-primary" : "text-muted-foreground"
            )}>
              {reaction.count}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}

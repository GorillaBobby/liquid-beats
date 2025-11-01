import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

interface SessionParticipant {
  id: string;
  user_id: string;
  profiles?: {
    username: string;
    avatar_url?: string;
  };
}

interface ChatMessage {
  id: string;
  user_id: string;
  message?: string;
  reaction?: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url?: string;
  };
}

interface GroupSession {
  id: string;
  host_id: string;
  track_id: string;
  session_code: string;
  is_active: boolean;
  playback_time: number;
  is_playing: boolean;
  tracks?: {
    title: string;
    artist_id: string;
    cover_url?: string;
    audio_url: string;
  };
}

export const useGroupSession = () => {
  const [currentSession, setCurrentSession] = useState<GroupSession | null>(null);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isHost, setIsHost] = useState(false);
  const { toast } = useToast();
  const { setCurrentTrack, seek, togglePlay, isPlaying, currentTime } = useAudioPlayer();

  const createSession = async (trackId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Generate session code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_session_code' as any) as any;
      
      if (codeError) throw codeError;

      // Create session
      const { data: session, error } = await supabase
        .from('listening_sessions' as any)
        .insert({
          host_id: user.id,
          track_id: trackId,
          session_code: codeData,
          is_active: true
        })
        .select(`
          *,
          tracks (
            title,
            artist_id,
            cover_url,
            audio_url
          )
        `)
        .single() as any;

      if (error) throw error;

      // Add host as participant
      await supabase
        .from('session_participants' as any)
        .insert({
          session_id: session.id,
          user_id: user.id
        });

      setCurrentSession(session as any);
      setIsHost(true);

      toast({
        title: "Session créée !",
        description: `Code: ${session.session_code}`,
      });

      return session.session_code;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const joinSession = async (sessionCode: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Find session
      const { data: session, error } = await supabase
        .from('listening_sessions' as any)
        .select(`
          *,
          tracks (
            title,
            artist_id,
            cover_url,
            audio_url
          )
        `)
        .eq('session_code', sessionCode.toUpperCase())
        .eq('is_active', true)
        .single() as any;

      if (error) throw new Error("Session introuvable");

      // Join session
      const { error: joinError } = await supabase
        .from('session_participants' as any)
        .insert({
          session_id: session.id,
          user_id: user.id
        });

      if (joinError && !joinError.message.includes('duplicate')) {
        throw joinError;
      }

      setCurrentSession(session as any);
      setIsHost(session.host_id === user.id);

      // Load track
      if (session.tracks) {
        setCurrentTrack({
          id: session.track_id,
          title: session.tracks.title,
          artist: session.tracks.artist_id,
          cover: session.tracks.cover_url || '',
          audioUrl: session.tracks.audio_url
        });
        
        // Sync to current time
        setTimeout(() => seek(session.playback_time), 500);
      }

      toast({
        title: "Session rejointe !",
        description: `Écoute en groupe de "${session.tracks?.title}"`,
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const leaveSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !currentSession) return;

      if (isHost) {
        // End session if host
        await supabase
          .from('listening_sessions' as any)
          .update({ is_active: false })
          .eq('id', currentSession.id);
      } else {
        // Leave session
        await supabase
          .from('session_participants' as any)
          .delete()
          .eq('session_id', currentSession.id)
          .eq('user_id', user.id);
      }

      setCurrentSession(null);
      setParticipants([]);
      setChatMessages([]);
      setIsHost(false);

      toast({
        title: "Session quittée",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (message: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !currentSession) return;

      await supabase
        .from('session_chat' as any)
        .insert({
          session_id: currentSession.id,
          user_id: user.id,
          message
        });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    }
  };

  const sendReaction = async (reaction: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !currentSession) return;

      await supabase
        .from('session_chat' as any)
        .insert({
          session_id: currentSession.id,
          user_id: user.id,
          reaction
        });
    } catch (error: any) {
      console.error("Error sending reaction:", error);
    }
  };

  // Sync playback state for host
  const syncPlayback = useCallback(async () => {
    if (!isHost || !currentSession) return;

    try {
      await supabase
        .from('listening_sessions' as any)
        .update({
          playback_time: currentTime,
          is_playing: isPlaying,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSession.id);
    } catch (error) {
      console.error("Error syncing playback:", error);
    }
  }, [isHost, currentSession, currentTime, isPlaying]);

  // Manual sync for pause/play/seek changes
  useEffect(() => {
    if (isHost && currentSession) {
      syncPlayback();
    }
  }, [isPlaying]);

  // Auto-sync every 2 seconds for host
  useEffect(() => {
    if (!isHost || !currentSession) return;

    const interval = setInterval(syncPlayback, 2000);
    return () => clearInterval(interval);
  }, [isHost, currentSession, syncPlayback]);

  // Subscribe to session changes
  useEffect(() => {
    if (!currentSession) return;

    const channel = supabase
      .channel(`session:${currentSession.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'listening_sessions',
          filter: `id=eq.${currentSession.id}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' && !isHost) {
            const updated = payload.new as GroupSession;
            
            // Sync playback for participants
            if (Math.abs(updated.playback_time - currentTime) > 2) {
              seek(updated.playback_time);
            }
            
            if (updated.is_playing !== isPlaying) {
              togglePlay();
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${currentSession.id}`
        },
        async () => {
          // Reload participants
          const { data } = await supabase
            .from('session_participants' as any)
            .select(`
              *,
              profiles (
                username,
                avatar_url
              )
            `)
            .eq('session_id', currentSession.id) as any;
          
          if (data) setParticipants(data);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_chat',
          filter: `session_id=eq.${currentSession.id}`
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', payload.new.user_id)
            .single();

          setChatMessages(prev => [...prev, {
            ...payload.new as any,
            profiles: profile
          }]);
        }
      )
      .subscribe();

    // Load initial participants and messages
    (async () => {
      const { data: partData } = await supabase
        .from('session_participants' as any)
        .select(`
          *,
          profiles (
            username,
            avatar_url
          )
        `)
        .eq('session_id', currentSession.id) as any;

      const { data: chatData } = await supabase
        .from('session_chat' as any)
        .select(`
          *,
          profiles (
            username,
            avatar_url
          )
        `)
        .eq('session_id', currentSession.id)
        .order('created_at', { ascending: true }) as any;

      if (partData) setParticipants(partData);
      if (chatData) setChatMessages(chatData);
    })();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentSession, isHost]);

  return {
    currentSession,
    participants,
    chatMessages,
    isHost,
    createSession,
    joinSession,
    leaveSession,
    sendMessage,
    sendReaction,
    syncPlayback
  };
};

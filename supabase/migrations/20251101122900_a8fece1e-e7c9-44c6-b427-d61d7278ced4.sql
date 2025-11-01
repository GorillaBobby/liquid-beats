-- Create listening_sessions table
CREATE TABLE IF NOT EXISTS public.listening_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  session_code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  playback_time NUMERIC DEFAULT 0,
  is_playing BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create session_participants table
CREATE TABLE IF NOT EXISTS public.session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.listening_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Create session_chat table
CREATE TABLE IF NOT EXISTS public.session_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.listening_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  reaction TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create function to generate random 6-character session code
CREATE OR REPLACE FUNCTION public.generate_session_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 6-character code (uppercase letters and numbers)
    code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM listening_sessions WHERE session_code = code) INTO exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Enable RLS
ALTER TABLE public.listening_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_chat ENABLE ROW LEVEL SECURITY;

-- RLS Policies for listening_sessions
CREATE POLICY "Users can view active sessions"
  ON public.listening_sessions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can create sessions"
  ON public.listening_sessions FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their sessions"
  ON public.listening_sessions FOR UPDATE
  USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their sessions"
  ON public.listening_sessions FOR DELETE
  USING (auth.uid() = host_id);

-- RLS Policies for session_participants
CREATE POLICY "Users can view session participants"
  ON public.session_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can join sessions"
  ON public.session_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave sessions"
  ON public.session_participants FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for session_chat
CREATE POLICY "Users can view session chat"
  ON public.session_chat FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = session_chat.session_id
      AND session_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages"
  ON public.session_chat FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = session_chat.session_id
      AND session_participants.user_id = auth.uid()
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.listening_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_chat;

-- Add trigger for updated_at
CREATE TRIGGER handle_listening_sessions_updated_at
  BEFORE UPDATE ON public.listening_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
-- Create listening history table to track user's play history
CREATE TABLE IF NOT EXISTS public.listening_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.listening_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own listening history
CREATE POLICY "Users can view own listening history" 
ON public.listening_history 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own listening history
CREATE POLICY "Users can insert own listening history" 
ON public.listening_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_listening_history_user_id ON public.listening_history(user_id);
CREATE INDEX idx_listening_history_played_at ON public.listening_history(played_at DESC);
CREATE INDEX idx_listening_history_track_id ON public.listening_history(track_id);
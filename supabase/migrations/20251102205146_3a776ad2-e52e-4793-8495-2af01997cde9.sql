-- Create actus_reactions table for emoji reactions
CREATE TABLE IF NOT EXISTS public.actus_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actus_id UUID NOT NULL REFERENCES public.actus(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create unique constraint: one reaction per user per actu per emoji
CREATE UNIQUE INDEX IF NOT EXISTS idx_actus_reactions_unique 
ON public.actus_reactions(actus_id, user_id, emoji);

-- Enable RLS
ALTER TABLE public.actus_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone can view reactions
CREATE POLICY "Anyone can view actus reactions"
ON public.actus_reactions
FOR SELECT
TO authenticated
USING (true);

-- Users can add their own reactions
CREATE POLICY "Users can add own reactions"
ON public.actus_reactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can remove their own reactions
CREATE POLICY "Users can remove own reactions"
ON public.actus_reactions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_actus_reactions_actus_id ON public.actus_reactions(actus_id);
CREATE INDEX IF NOT EXISTS idx_actus_reactions_user_id ON public.actus_reactions(user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.actus_reactions;

-- Create news/actus table
CREATE TABLE public.actus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.actus ENABLE ROW LEVEL SECURITY;

-- Everyone can view actus
CREATE POLICY "Everyone can view actus"
ON public.actus
FOR SELECT
USING (true);

-- Only admins can create actus
CREATE POLICY "Admins can create actus"
ON public.actus
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Only admins can update actus
CREATE POLICY "Admins can update actus"
ON public.actus
FOR UPDATE
USING (is_admin(auth.uid()));

-- Only admins can delete actus
CREATE POLICY "Admins can delete actus"
ON public.actus
FOR DELETE
USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_actus_updated_at
BEFORE UPDATE ON public.actus
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
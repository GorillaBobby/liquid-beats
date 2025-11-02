-- Create admin announcements table
CREATE TABLE public.admin_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_announcements ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage announcements
CREATE POLICY "Admins can manage announcements"
ON public.admin_announcements
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Policy for everyone to view active announcements
CREATE POLICY "Everyone can view announcements"
ON public.admin_announcements
FOR SELECT
USING (true);

-- Enable realtime for announcements
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_announcements;

-- Trigger for updated_at
CREATE TRIGGER update_admin_announcements_updated_at
BEFORE UPDATE ON public.admin_announcements
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
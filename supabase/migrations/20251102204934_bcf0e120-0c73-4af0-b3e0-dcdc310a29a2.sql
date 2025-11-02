-- Create track_reports table for reporting tracks
CREATE TABLE IF NOT EXISTS public.track_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL,
  reporter_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.track_reports ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can create their own reports
CREATE POLICY "Users can create own track reports"
ON public.track_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view own track reports"
ON public.track_reports
FOR SELECT
TO authenticated
USING (auth.uid() = reporter_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all track reports"
ON public.track_reports
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Admins can update report status
CREATE POLICY "Admins can update track reports"
ON public.track_reports
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

-- Trigger to keep updated_at current
DROP TRIGGER IF EXISTS update_track_reports_updated_at ON public.track_reports;
CREATE TRIGGER update_track_reports_updated_at
BEFORE UPDATE ON public.track_reports
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Optional helpful indexes
CREATE INDEX IF NOT EXISTS idx_track_reports_track_id ON public.track_reports(track_id);
CREATE INDEX IF NOT EXISTS idx_track_reports_reporter_id ON public.track_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_track_reports_status ON public.track_reports(status);

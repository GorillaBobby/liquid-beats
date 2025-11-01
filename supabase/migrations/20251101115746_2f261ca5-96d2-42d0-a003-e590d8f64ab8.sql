-- Add verification tier column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verified_tier text CHECK (verified_tier IN ('normal', 'gold'));

-- Update RLS policy to allow admins to update any profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() = id 
  OR public.is_admin(auth.uid())
);
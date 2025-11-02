-- Drop the problematic trigger on profiles if it exists
DROP TRIGGER IF EXISTS log_new_user_trigger ON profiles;

-- Recreate the function to handle both auth.users and profiles
CREATE OR REPLACE FUNCTION public.log_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only log if this is from auth.users (which has email field)
  IF TG_TABLE_NAME = 'users' THEN
    INSERT INTO public.admin_logs (event_type, user_id, user_email, details)
    VALUES (
      'new_user',
      NEW.id,
      NEW.email,
      jsonb_build_object(
        'user_type', COALESCE(NEW.raw_user_meta_data->>'user_type', 'fan'),
        'username', COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
      )
    );
  END IF;
  RETURN NEW;
END;
$function$;
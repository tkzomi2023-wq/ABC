/*
# Update handle_new_user trigger to respect role from signup metadata

1. Changes:
   - The `handle_new_user()` trigger function now reads the `role` from
     `raw_user_meta_data->>'role'` when the user selects "student" during
     registration. If the metadata role is 'student', the profile is created
     with role='student'. Otherwise it defaults to 'standard' (or 'admin'/
     'faculty' for the hardcoded emails).
   - This allows the UserReg page to set the role automatically based on
     the user's account type selection, without admin intervention.

2. Security:
   - No RLS changes. The trigger is SECURITY DEFINER and runs on auth.users
     INSERT, same as before.
   - The role from metadata is only used for 'student'; admin/faculty are
     still hardcoded by email to prevent privilege escalation via signup.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
assigned_role text := 'standard';
assigned_theme text := 'classic';
signup_role text;
BEGIN
-- Assign role based on email (hardcoded for security)
IF NEW.email = 'tkpaite2016@gmail.com' THEN
  assigned_role := 'admin';
  assigned_theme := 'aurora';
ELSIF NEW.email = 'csmuanga7@gmail.com' THEN
  assigned_role := 'faculty';
  assigned_theme := 'royal-gold';
ELSE
  -- Read role from signup metadata (only 'student' is honored from the frontend)
  signup_role := NEW.raw_user_meta_data->>'role';
  IF signup_role = 'student' THEN
    assigned_role := 'student';
  END IF;
END IF;

-- Insert profile with appropriate defaults
INSERT INTO public.profiles (id, email, full_name, role, profile_theme)
VALUES (
  NEW.id,
  NEW.email,
  COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
  assigned_role,
  assigned_theme
)
ON CONFLICT (id) DO NOTHING;

RETURN NEW;
END;
$function$;

-- 1. Create function in public schema
CREATE OR REPLACE FUNCTION public.generate_unique_fb_id()
RETURNS text AS $$
DECLARE
  new_id text;
  done bool;
BEGIN
  done := false;
  WHILE NOT done LOOP
    new_id := 'FB-' || 
              upper(substring(md5(random()::text) from 1 for 4)) || '-' || 
              upper(substring(md5(random()::text) from 5 for 4));
              
    done := NOT exists(SELECT 1 FROM public.users WHERE unique_id = new_id);
  END LOOP;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT EXECUTE ON FUNCTION public.generate_unique_fb_id() TO anon, authenticated, service_role, postgres;

-- 2. Update/Re-create the trigger function to explicitly use public.generate_unique_fb_id()
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, unique_id)
  VALUES (
    new.id,
    new.email,
    public.generate_unique_fb_id()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Re-bind the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

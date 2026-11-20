-- Run this SQL against your Neon/Supabase Postgres database
ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday TEXT;

-- Update trigger function to include birthday and usertag/gamer_tag
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, unique_id, first_name, last_name, gamer_tag, birthday)
  VALUES (
    new.id::text,
    public.generate_unique_fb_id(),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    COALESCE(new.raw_user_meta_data->>'gamer_tag', new.raw_user_meta_data->>'usertag'),
    new.raw_user_meta_data->>'birthday'
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.users.last_name),
    gamer_tag = COALESCE(EXCLUDED.gamer_tag, public.users.gamer_tag),
    birthday = COALESCE(EXCLUDED.birthday, public.users.birthday);
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Prevent trigger errors from blocking auth.users creation
  RAISE WARNING 'handle_new_user trigger error: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

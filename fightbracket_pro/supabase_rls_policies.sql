-- 1. Securing the User Messages Table (Table: direct_messages)
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can send messages as themselves" ON direct_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can view their own chat history" ON direct_messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can delete their own sent messages" ON direct_messages FOR DELETE TO authenticated USING (auth.uid() = sender_id);

-- 2. Managing Public vs. Private Profiles (Table: users)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can update their own profile" ON users FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Anyone can view public profiles, owners can view private ones" ON users FOR SELECT USING (
  is_public = true 
  OR 
  (auth.role() = 'authenticated' AND auth.uid() = id)
);

-- Note: We don't have a user_integrations table. External integrations are stored on the users table.
-- Because our app uses a custom Python API to fetch data (which bypasses RLS securely),
-- our Python backend handles hiding sensitive tokens like startgg_token before sending profile data to the frontend.

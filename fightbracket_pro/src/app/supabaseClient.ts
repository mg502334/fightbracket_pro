import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dagmdetirrbvcaggzmdh.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhZ21kZXRpcnJidmNhZ2d6bWRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3Njg2MDcsImV4cCI6MjEwMDM0NDYwN30.twSlCY0DfVNBfzleiYjhsWn7K5DhVG2TuNUJvJC4b0g'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

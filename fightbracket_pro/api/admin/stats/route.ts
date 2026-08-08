import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [total, last24h] = await Promise.all([
    supabase.from('auth.users').select('*', { count: 'exact', head: true }),
    supabase
      .from('auth.users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 86400000).toISOString())
  ]);

  return Response.json({
    total_users: total.count,
    new_users_24h: last24h.count
  });
}

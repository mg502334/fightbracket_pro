import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') ?? '';

  const { data, error } = await supabase
    .from('full_user')
    .select('*')
    .or(`
      email.ilike.%${query}%,
      first_name.ilike.%${query}%,
      last_name.ilike.%${query}%,
      gamer_tag.ilike.%${query}%,
      unique_id.ilike.%${query}%
    `)
    .order('created_at', { ascending: false });

  if (error) return Response.json({ error }, { status: 500 });
  return Response.json(data);
}

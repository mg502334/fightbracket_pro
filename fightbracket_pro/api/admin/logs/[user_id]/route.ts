import { createClient } from '@supabase/supabase-js';

export async function GET(
  req: Request,
  { params }: { params: { user_id: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('audit_log_entries')
    .select('*')
    .eq('user_id', params.user_id)
    .order('created_at', { ascending: false });

  if (error) return Response.json({ error }, { status: 500 });
  return Response.json(data);
}

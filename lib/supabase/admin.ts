import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

// Cliente com a service role key — ignora RLS. Uso restrito a rotinas de servidor
// confiáveis (ex.: cron), nunca exposto ao navegador.
export function createAdminSupabaseClient() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

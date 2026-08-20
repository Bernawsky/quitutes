import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/types"

// Cliente Supabase para uso em Server Components / Server Actions.
// Respeita a sessão do usuário (cookies) e, portanto, o RLS do banco.
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Chamado a partir de um Server Component sem permissão de escrita;
            // o middleware cuida de manter a sessão atualizada nesse caso.
          }
        },
      },
    },
  )
}

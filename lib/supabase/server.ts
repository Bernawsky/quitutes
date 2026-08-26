import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
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

/**
 * Usado em Server Components de páginas restritas a administradores (métricas, administração).
 * Só checar `user` não bastava: qualquer pousada logada também passava por lá — o papel
 * precisa ser conferido no servidor (RLS de user_roles já limita a leitura ao próprio papel).
 */
export async function exigirAdminServer() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
  if (!data) redirect("/")
}

/** Usado na página /leitor: acesso liberado para admins e para a equipe da cozinha (papel "operador"). */
export async function exigirEquipeServer() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).in("role", ["admin", "operador"])
  if (!data || data.length === 0) redirect("/")
}

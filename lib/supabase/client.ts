import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/lib/supabase/types"

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

let _supabase: ReturnType<typeof createClient> | undefined

// Instância única para uso direto em componentes cliente, criada de forma preguiçosa:
// evita que a pré-renderização estática no servidor (durante o build) tente montar o
// cliente antes das variáveis de ambiente estarem disponíveis.
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createClient()
    return Reflect.get(_supabase, prop, receiver)
  },
})

import { createBrowserClient } from "@supabase/ssr"
import type { Session } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

let _supabase: ReturnType<typeof createClient> | undefined

function obterCliente() {
  if (!_supabase) {
    _supabase = createClient()

    if (typeof document !== "undefined") {
      // Em segundo plano (aba minimizada, celular bloqueado etc.) o navegador pode suspender
      // o timer de renovação automática do token. Sem isso, ao voltar, o token já expirou e
      // ninguém pediu um novo — parecendo que a sessão "caiu" sozinha.
      document.addEventListener("visibilitychange", () => {
        if (!_supabase) return
        if (document.visibilityState === "visible") void _supabase.auth.startAutoRefresh()
        else void _supabase.auth.stopAutoRefresh()
      })
    }
  }
  return _supabase
}

// Instância única para uso direto em componentes cliente, criada de forma preguiçosa:
// evita que a pré-renderização estática no servidor (durante o build) tente montar o
// cliente antes das variáveis de ambiente estarem disponíveis.
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop, receiver) {
    return Reflect.get(obterCliente(), prop, receiver)
  },
})

/**
 * Lê a sessão atual e força uma renovação se ela já estiver (ou estiver perto de ficar)
 * expirada — cobre o caso de reabrir o app depois de muito tempo em segundo plano, quando
 * o refresh automático não teve chance de rodar.
 */
export async function sessaoAtualRenovada(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  const sessao = data.session
  if (!sessao) return null

  const prestesAExpirar = (sessao.expires_at ?? 0) * 1000 < Date.now() + 60_000
  if (!prestesAExpirar) return sessao

  const { data: renovada, error } = await supabase.auth.refreshSession()
  if (error) return null
  return renovada.session
}

import { createBrowserClient } from "@supabase/ssr"
import type { CookieOptions } from "@supabase/ssr"
import type { Session } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

/** Uma entrada de setAll conta como "apagar" quando o valor fica vazio ou a validade expira. */
function ehRemocaoDeCookie(value: string, options?: CookieOptions): boolean {
  if (value === "") return true
  if (options?.maxAge !== undefined && options.maxAge <= 0) return true
  if (options?.expires && options.expires.getTime() <= Date.now()) return true
  return false
}

/**
 * decodeURIComponent lança exceção em sequências "%" inválidas — um único cookie de
 * terceiro (extensão do navegador, pixel de analytics etc.) com um valor malformado
 * não pode derrubar a leitura dos outros cookies (inclusive o de sessão). O pacote
 * "cookie" (usado pelo próprio @supabase/ssr) trata esse caso do mesmo jeito: cai
 * para o valor bruto em vez de propagar o erro.
 */
function decodeSeguro(valor: string): string {
  if (!valor.includes("%")) return valor
  try {
    return decodeURIComponent(valor)
  } catch {
    return valor
  }
}

function lerCookiesDoDocumento(): { name: string; value: string }[] {
  if (!document.cookie) return []
  return document.cookie.split(";").map((par) => {
    const idx = par.indexOf("=")
    if (idx === -1) return { name: par.trim(), value: "" }
    const name = par.slice(0, idx).trim()
    const value = decodeSeguro(par.slice(idx + 1).trim())
    return { name, value }
  })
}

function serializarCookie(name: string, value: string, options?: CookieOptions): string {
  let str = `${name}=${encodeURIComponent(value)}`
  if (options?.maxAge !== undefined) str += `; Max-Age=${Math.floor(options.maxAge)}`
  if (options?.expires) str += `; Expires=${options.expires.toUTCString()}`
  str += `; Path=${options?.path ?? "/"}`
  if (options?.domain) str += `; Domain=${options.domain}`
  if (options?.sameSite) str += `; SameSite=${options.sameSite}`
  if (options?.secure) str += "; Secure"
  return str
}

/**
 * true só durante um logout explícito (ver encerrarSessao) — é o único momento em que um
 * cookie de sessão deve mesmo ser apagado no navegador.
 */
let permitirRemocaoDeCookie = false

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (typeof document === "undefined") return []
          return lerCookiesDoDocumento()
        },
        setAll(cookiesToSet) {
          if (typeof document === "undefined") return
          // Mesma corrida descrita em middleware.ts, só que do lado do navegador: se o refresh
          // automático do GoTrueClient (rodando aqui) e o do middleware (numa requisição do
          // servidor) tentarem renovar o MESMO refresh token ao mesmo tempo, quem perde recebe
          // "already used" e o supabase-js reage tentando apagar o cookie de sessão local — o
          // que derrubava o login sozinho mesmo já com o token bom (renovado pelo outro lado)
          // salvo no cookie. Um logout de verdade passa por encerrarSessao(), que libera essa
          // remoção de propósito.
          const atualizacoes = permitirRemocaoDeCookie
            ? cookiesToSet
            : cookiesToSet.filter(({ value, options }) => !ehRemocaoDeCookie(value, options))
          for (const { name, value, options } of atualizacoes) {
            document.cookie = serializarCookie(name, value, options)
          }
        },
      },
    },
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

/** Logout explícito — único caso em que os cookies de sessão devem mesmo ser apagados no navegador. */
export async function encerrarSessao() {
  permitirRemocaoDeCookie = true
  try {
    await supabase.auth.signOut()
  } finally {
    permitirRemocaoDeCookie = false
  }
}

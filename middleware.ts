import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/** Uma entrada de cookiesToSet conta como "apagar" quando o valor fica vazio ou a validade expira. */
function ehRemocaoDeCookie(value: string, options?: { maxAge?: number; expires?: Date }): boolean {
  if (value === "") return true
  if (options?.maxAge !== undefined && options.maxAge <= 0) return true
  if (options?.expires && options.expires.getTime() <= Date.now()) return true
  return false
}

// Diagnóstico temporário do bug de sessão que não persiste entre fechar/abrir o app —
// loga só metadados (nomes de cookie, ids, códigos de erro), nunca o conteúdo dos tokens.
// Ver DIAGNOSTICO-SESSAO.md. Remover depois que a causa for confirmada e corrigida.
function logDiag(request: NextRequest, dados: Record<string, unknown>) {
  console.log(
    "[diag-sessao]",
    JSON.stringify({ path: request.nextUrl.pathname, ...dados }),
  )
}

// Mantém a sessão do Supabase Auth atualizada em cada requisição
// (necessário para que as Server Actions/Server Components vejam o usuário logado).
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const cookiesEntrada = request.cookies.getAll().filter((c) => c.name.startsWith("sb-"))
  let setAllChamadas = 0

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          setAllChamadas += 1
          // Uma navegação dispara várias requisições em paralelo (página + fetches do RSC).
          // Se o access token já expirou, cada uma tenta renovar o refresh token ao mesmo tempo —
          // como o Supabase invalida o refresh token depois do primeiro uso, as requisições que
          // perdem essa corrida recebem "already used" e o supabase-js reage apagando a sessão
          // (cookies com maxAge 0). Sem esse filtro, essa limpeza de uma requisição perdedora
          // podia sobrescrever a sessão que outra requisição, em paralelo, acabou de renovar com
          // sucesso — é isso que estava derrubando o login sozinho. O middleware nunca precisa
          // apagar cookie de sessão: logout explícito já limpa do lado do cliente
          // (supabase.auth.signOut()), e uma sessão de fato inválida continua sendo barrada pelos
          // guards de página (exigirAdminServer/exigirEquipeServer).
          const atualizacoes = cookiesToSet.filter(({ value, options }) => !ehRemocaoDeCookie(value, options))
          logDiag(request, {
            evento: "setAll",
            chamadaNumero: setAllChamadas,
            recebidos: cookiesToSet.map((c) => ({ nome: c.name, remocao: ehRemocaoDeCookie(c.value, c.options) })),
            aplicados: atualizacoes.map((c) => c.name),
          })
          if (atualizacoes.length === 0) return
          for (const { name, value } of atualizacoes) request.cookies.set(name, value)
          response = NextResponse.next({ request })
          for (const { name, value, options } of atualizacoes) response.cookies.set(name, value, options)
        },
      },
    },
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  logDiag(request, {
    evento: "getUser",
    cookiesEntrada: cookiesEntrada.map((c) => c.name),
    userId: user?.id ?? null,
    erro: error ? { name: error.name, status: error.status, message: error.message } : null,
    setAllChamadas,
  })

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}

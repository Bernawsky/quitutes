import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { SOMENTE_PRODUCAO } from "@/lib/manutencao"

/** Uma entrada de cookiesToSet conta como "apagar" quando o valor fica vazio ou a validade expira. */
function ehRemocaoDeCookie(value: string, options?: { maxAge?: number; expires?: Date }): boolean {
  if (value === "") return true
  if (options?.maxAge !== undefined && options.maxAge <= 0) return true
  if (options?.expires && options.expires.getTime() <= Date.now()) return true
  return false
}

// MODO MANUTENÇÃO (ver lib/manutencao.ts): só a ferramenta de produção (e o login, que ela
// exige) fica no ar — o resto do site redireciona pra lá.
const ROTAS_LIBERADAS_EM_MANUTENCAO = ["/", "/producao"]

function liberadaEmManutencao(pathname: string): boolean {
  if (pathname.startsWith("/api/")) return true
  return ROTAS_LIBERADAS_EM_MANUTENCAO.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`))
}

export async function middleware(request: NextRequest) {
  if (SOMENTE_PRODUCAO) {
    const { pathname } = request.nextUrl
    if (!liberadaEmManutencao(pathname)) {
      return NextResponse.redirect(new URL("/producao", request.url))
    }
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
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
          //
          // Isso não é só defesa: era a causa raiz confirmada em produção. A cada navegação, o
          // navegador também busca /manifest.webmanifest e registra /sw.js em paralelo com o
          // documento principal — três requisições batendo no middleware ao mesmo tempo. Quando o
          // access token estava expirado, as três tentavam renovar o MESMO refresh token ao mesmo
          // tempo; o Supabase detecta esse reuso e revoga o refresh token inteiro no servidor dele
          // ("Refresh Token Not Found" em toda tentativa seguinte) — uma vez revogado, nenhum
          // filtro de cookie local resolve, porque o problema não é mais o cookie do navegador, é o
          // token não existir mais no Supabase. Por isso agora o matcher abaixo exclui esses dois
          // arquivos: eles não precisam de sessão nenhuma pra funcionar.
          const atualizacoes = cookiesToSet.filter(({ value, options }) => !ehRemocaoDeCookie(value, options))
          if (atualizacoes.length === 0) return
          for (const { name, value } of atualizacoes) request.cookies.set(name, value)
          response = NextResponse.next({ request })
          for (const { name, value, options } of atualizacoes) response.cookies.set(name, value, options)
        },
      },
    },
  )

  // A causa real da página "caindo": supabase.auth.getUser() faz uma chamada de rede pro
  // Supabase, e quando essa chamada falha (AuthRetryableFetchError, "fetch failed") o supabase-js
  // fica tentando de novo sozinho — sem limite de tempo nosso, isso passava dos 25s que a Vercel
  // dá pro middleware, e a função era encerrada à força (é esse o erro que aparecia pro usuário
  // como a página travando/caindo). Agora, se o Supabase não responder rápido, o middleware
  // desiste e segue em frente sem bloquear a navegação — os guards de página (exigirAdminServer
  // etc.) continuam checando a sessão de verdade depois.
  await Promise.race([
    supabase.auth.getUser().catch(() => null),
    new Promise((resolve) => setTimeout(resolve, 8000)),
  ])

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

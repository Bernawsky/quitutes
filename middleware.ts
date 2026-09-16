import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/** Uma entrada de cookiesToSet conta como "apagar" quando o valor fica vazio ou a validade expira. */
function ehRemocaoDeCookie(value: string, options?: { maxAge?: number; expires?: Date }): boolean {
  if (value === "") return true
  if (options?.maxAge !== undefined && options.maxAge <= 0) return true
  if (options?.expires && options.expires.getTime() <= Date.now()) return true
  return false
}

// Mantém a sessão do Supabase Auth atualizada em cada requisição
// (necessário para que as Server Actions/Server Components vejam o usuário logado).
export async function middleware(request: NextRequest) {
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

  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

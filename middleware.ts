import { NextResponse, type NextRequest } from "next/server"
import { SOMENTE_PRODUCAO } from "@/lib/manutencao"

// MODO MANUTENÇÃO (ver lib/manutencao.ts): só a ferramenta de produção fica no ar, sem exigir
// login (app/producao/page.tsx não tem mais exigirEquipeServer) — o resto do site redireciona
// pra lá, incluindo a própria "/" (o login foi desligado de propósito).
const ROTAS_LIBERADAS_EM_MANUTENCAO = ["/producao"]

function liberadaEmManutencao(pathname: string): boolean {
  if (pathname.startsWith("/api/")) return true
  return ROTAS_LIBERADAS_EM_MANUTENCAO.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`))
}

// Com o modo manutenção ligado, a única rota disponível (/producao) não exige sessão —
// não há mais login pra manter atualizado aqui, então o middleware nem precisa falar com o
// Supabase Auth. Isso também tira de vez a lentidão que a chamada de rede causava quando o
// Supabase estava fora do ar (ver histórico de commits: timeout de 8s, depois descoberto que o
// projeto do Supabase tinha pausado por inatividade).
export function middleware(request: NextRequest) {
  if (SOMENTE_PRODUCAO) {
    const { pathname } = request.nextUrl
    if (!liberadaEmManutencao(pathname)) {
      return NextResponse.redirect(new URL("/producao", request.url))
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

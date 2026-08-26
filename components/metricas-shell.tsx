"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ArrowLeft, Settings, LogOut, X, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FiltroMetricas } from "@/components/filtro-metricas"
import { AvisosBell } from "@/components/avisos-bell"
import { AvisoPushDesativado } from "@/components/aviso-push-desativado"
import { useAuth } from "@/hooks/use-auth"
import { useFiltrosMetricas } from "@/hooks/use-filtros-metricas"
import { useDadosMetricas, useRealtimePedidos } from "@/hooks/use-dados-metricas"
import { supabase } from "@/lib/supabase/client"

const ABAS = [
  { href: "/metricas", label: "Visão geral" },
  { href: "/metricas/pedidos", label: "Pedidos" },
  { href: "/metricas/historico", label: "Histórico" },
  { href: "/metricas/feedbacks", label: "Feedbacks" },
  { href: "/metricas/buffet", label: "Buffet" },
]

export function MetricasShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const { periodo, setPeriodo, pousadasSelecionadas, togglePousada, limparPousadas } = useFiltrosMetricas()
  const { pousadas, pendencias } = useDadosMetricas()
  const [pendenciasFechadas, setPendenciasFechadas] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [pilula, setPilula] = useState<{ left: number; width: number } | null>(null)
  useRealtimePedidos()

  const indiceAtivo = ABAS.findIndex((a) => a.href === pathname)

  useLayoutEffect(() => {
    const ativo = tabRefs.current[indiceAtivo]
    if (!ativo) return
    setPilula({ left: ativo.offsetLeft, width: ativo.offsetWidth })
    ativo.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" })
  }, [indiceAtivo])

  useEffect(() => {
    const recalcular = () => {
      const ativo = tabRefs.current[indiceAtivo]
      if (ativo) setPilula({ left: ativo.offsetLeft, width: ativo.offsetWidth })
    }
    window.addEventListener("resize", recalcular)
    return () => window.removeEventListener("resize", recalcular)
  }, [indiceAtivo])

  const chavePendencias = pendencias.map((p) => p.id).join(",")
  useEffect(() => setPendenciasFechadas(false), [chavePendencias])

  // Na Visão geral o aviso some sozinho depois de 1 minuto (ainda dá pra fechar antes pelo X).
  // Em Pedidos ele fica fixo, sem esconder. Nas outras abas (Histórico, Feedbacks, Buffet) nem aparece.
  useEffect(() => {
    if (pathname !== "/metricas") return
    const temporizador = setTimeout(() => setPendenciasFechadas(true), 60_000)
    return () => clearTimeout(temporizador)
  }, [pathname, chavePendencias])

  const abaComPendencia = pathname === "/metricas" || pathname === "/metricas/pedidos"
  const pendenciaFixa = pathname === "/metricas/pedidos"
  const mostrarPendencia = abaComPendencia && pendencias.length > 0 && (pendenciaFixa || !pendenciasFechadas)

  const sair = async () => {
    await supabase.auth.signOut()
    router.replace("/")
  }

  return (
    <div className="min-h-svh bg-background pb-12">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-4">
          <Link
            href="/"
            className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Voltar aos pedidos"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <div className="mr-auto">
            <h1 className="font-heading text-lg font-bold text-card-foreground">Métricas</h1>
          </div>
          <div className="flex items-center gap-2">
            <AvisosBell />
            <Link href="/administracao" className="hidden items-center gap-2 sm:inline-flex">
              <Button variant="ghost" className="tap gap-2">
                <Settings className="size-4" aria-hidden="true" />
                Administração
              </Button>
            </Link>
            {user?.email && <span className="hidden text-xs text-muted-foreground sm:inline">{user.email}</span>}
            <Button variant="ghost" onClick={sair} className="tap gap-2">
              <LogOut className="size-4" aria-hidden="true" />
              Sair
            </Button>
          </div>
        </div>

        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 pb-3">
          <div className="relative min-w-0 flex-1">
            <nav ref={navRef} className="relative flex gap-1 overflow-x-auto rounded-lg bg-muted p-1 scroll-smooth">
              {pilula && (
                <span
                  className="absolute top-1 bottom-1 left-0 rounded-md bg-primary transition-[transform,width] duration-300 ease-out"
                  style={{ width: pilula.width, transform: `translateX(${pilula.left}px)` }}
                  aria-hidden="true"
                />
              )}
              {ABAS.map((aba, i) => {
                const ativa = pathname === aba.href
                return (
                  <Link
                    key={aba.href}
                    href={aba.href}
                    ref={(el) => {
                      tabRefs.current[i] = el
                    }}
                    className={
                      "tap relative z-10 shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
                      (ativa ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground")
                    }
                  >
                    {aba.label}
                  </Link>
                )
              })}
            </nav>
            <span
              className="pointer-events-none absolute inset-y-0 right-0 w-6 rounded-r-lg bg-gradient-to-l from-muted to-transparent"
              aria-hidden="true"
            />
          </div>
          <div className="ml-auto">
            <FiltroMetricas
              periodo={periodo}
              setPeriodo={setPeriodo}
              pousadas={pousadas}
              pousadasSelecionadas={pousadasSelecionadas}
              togglePousada={togglePousada}
              limparPousadas={limparPousadas}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5">
        <AvisoPushDesativado />
        {mostrarPendencia && (
          <div className="mb-5 flex items-start gap-2 rounded-2xl border border-yellow-300 bg-yellow-100 p-3.5 text-sm text-yellow-900">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-medium">Pousadas sem pedido hoje ({pendencias.length})</p>
              <p className="mt-0.5 text-yellow-900/80">{pendencias.map((p) => p.nome).join(", ")}</p>
            </div>
            {!pendenciaFixa && (
              <button
                type="button"
                onClick={() => setPendenciasFechadas(true)}
                aria-label="Fechar aviso de pendências"
                className="tap flex size-6 shrink-0 items-center justify-center rounded-md text-yellow-900/70 transition-colors hover:bg-yellow-200 hover:text-yellow-900"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
        {children}
      </main>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Settings,
  LogOut,
  AlertTriangle,
  LayoutDashboard,
  ShoppingBasket,
  MessageSquare,
  UtensilsCrossed,
  Menu,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { FiltroMetricas } from "@/components/filtro-metricas"
import { AvisosBell } from "@/components/avisos-bell"
import { AvisoPushDesativado } from "@/components/aviso-push-desativado"
import { useAuth } from "@/hooks/use-auth"
import { useFiltrosMetricas } from "@/hooks/use-filtros-metricas"
import { useDadosMetricas, useRealtimePedidos } from "@/hooks/use-dados-metricas"
import { encerrarSessao } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const ABAS = [
  { href: "/metricas", label: "Visão geral", icone: LayoutDashboard },
  { href: "/metricas/pedidos", label: "Pedidos", icone: ShoppingBasket },
  { href: "/metricas/feedbacks", label: "Feedbacks", icone: MessageSquare },
  { href: "/metricas/buffet", label: "Buffet", icone: UtensilsCrossed },
  { href: "/metricas/configuracoes", label: "Configurações", icone: Settings },
]

export function MetricasShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const { periodo, setPeriodo, pousadasSelecionadas, togglePousada, limparPousadas } = useFiltrosMetricas()
  const { pousadas, pendencias } = useDadosMetricas()
  const [menuAberto, setMenuAberto] = useState(false)
  useRealtimePedidos()

  // Fecha o menu ao navegar (o shell continua montado entre as abas — sem isso o menu ficava
  // aberto depois de escolher um destino).
  useEffect(() => setMenuAberto(false), [pathname])

  // Só aparece (fixo, sem botão de fechar) na aba Pedidos — na Visão geral e nas demais
  // abas (Histórico, Feedbacks, Buffet) não mostra mais esse aviso.
  const mostrarPendencia = pathname === "/metricas/pedidos" && pendencias.length > 0

  const sair = async () => {
    await encerrarSessao()
    router.replace("/")
  }

  return (
    <div className="min-h-svh bg-background md:flex">
      {/* Sidebar — só no desktop. No celular a navegação continua no topo (abas horizontais). */}
      <aside className="hidden md:sticky md:top-0 md:flex md:h-svh md:w-60 md:shrink-0 md:flex-col md:border-r md:border-border md:bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-4">
          <h1 className="font-heading text-lg font-bold text-card-foreground">Métricas</h1>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {ABAS.map((aba) => {
            const ativa = pathname === aba.href
            return (
              <Link
                key={aba.href}
                href={aba.href}
                className={
                  "tap flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors " +
                  (ativa ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground")
                }
              >
                <aba.icone className="size-4 shrink-0" aria-hidden="true" />
                {aba.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex flex-col gap-1 border-t border-border p-3">
          {user?.email && <p className="truncate px-3 pb-1 text-xs text-muted-foreground">{user.email}</p>}
          <Link href="/administracao">
            <Button variant="ghost" className="tap w-full justify-start gap-2.5">
              <Settings className="size-4 shrink-0" aria-hidden="true" />
              Administração
            </Button>
          </Link>
          <Button variant="ghost" onClick={sair} className="tap w-full justify-start gap-2.5">
            <LogOut className="size-4 shrink-0" aria-hidden="true" />
            Sair
          </Button>
        </div>
      </aside>

      <div className="min-w-0 flex-1 pb-12">
        {/* Cabeçalho — só no celular/tablet, escondido no desktop (a navegação vira a sidebar). */}
        <header className="border-b border-border bg-card md:hidden">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
            <h1 className="mr-auto font-heading text-lg font-bold text-card-foreground">Métricas</h1>
            <AvisosBell />
            <button
              type="button"
              onClick={() => setMenuAberto(true)}
              aria-label="Abrir menu"
              className="tap flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Menu className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mx-auto flex max-w-5xl items-center justify-end px-4 pb-3">
            <FiltroMetricas
              periodo={periodo}
              setPeriodo={setPeriodo}
              pousadas={pousadas}
              pousadasSelecionadas={pousadasSelecionadas}
              togglePousada={togglePousada}
              limparPousadas={limparPousadas}
            />
          </div>
        </header>

        {/* Fundo escurecido + painel do menu mobile — desliza da direita, itens abrem um a um. */}
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 md:hidden",
            menuAberto ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          onClick={() => setMenuAberto(false)}
          aria-hidden="true"
        />
        <div
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex w-72 max-w-[80vw] flex-col border-l border-border bg-card shadow-xl transition-transform duration-300 ease-out md:hidden",
            menuAberto ? "translate-x-0" : "translate-x-full",
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-4">
            <h2 className="font-heading text-base font-bold text-card-foreground">Menu</h2>
            <button
              type="button"
              onClick={() => setMenuAberto(false)}
              aria-label="Fechar menu"
              className="tap flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
            {ABAS.map((aba, i) => {
              const ativa = pathname === aba.href
              return (
                <Link
                  key={aba.href}
                  href={aba.href}
                  className={cn(
                    "tap flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-[background-color,color,opacity,transform] duration-300",
                    ativa ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    menuAberto ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0",
                  )}
                  style={{ transitionDelay: menuAberto ? `${80 + i * 50}ms` : "0ms" }}
                >
                  <aba.icone className="size-4 shrink-0" aria-hidden="true" />
                  {aba.label}
                </Link>
              )
            })}
          </nav>

          <div
            className={cn(
              "flex flex-col gap-1 border-t border-border p-3 transition-[opacity,transform] duration-300",
              menuAberto ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0",
            )}
            style={{ transitionDelay: menuAberto ? `${80 + ABAS.length * 50}ms` : "0ms" }}
          >
            {user?.email && <p className="truncate px-3 pb-1 text-xs text-muted-foreground">{user.email}</p>}
            <Link href="/administracao">
              <Button variant="ghost" className="tap w-full justify-start gap-2.5">
                <Settings className="size-4 shrink-0" aria-hidden="true" />
                Administração
              </Button>
            </Link>
            <Button variant="ghost" onClick={sair} className="tap w-full justify-start gap-2.5">
              <LogOut className="size-4 shrink-0" aria-hidden="true" />
              Sair
            </Button>
          </div>
        </div>

        {/* Barra de topo só no desktop (filtro + avisos) — no celular isso já está no header acima. */}
        <div className="hidden items-center justify-end gap-3 border-b border-border bg-card px-6 py-3 md:flex">
          <FiltroMetricas
            periodo={periodo}
            setPeriodo={setPeriodo}
            pousadas={pousadas}
            pousadasSelecionadas={pousadasSelecionadas}
            togglePousada={togglePousada}
            limparPousadas={limparPousadas}
          />
          <AvisosBell />
        </div>

        <main className="mx-auto max-w-5xl px-4 py-5 md:px-6">
          <AvisoPushDesativado />
          {mostrarPendencia && (
            <div className="mb-5 flex items-start gap-2 rounded-2xl border border-yellow-300 bg-yellow-100 p-3.5 text-sm text-yellow-900">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-medium">Pousadas sem pedido hoje ({pendencias.length})</p>
                <p className="mt-0.5 text-yellow-900/80">{pendencias.map((p) => p.nome).join(", ")}</p>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}

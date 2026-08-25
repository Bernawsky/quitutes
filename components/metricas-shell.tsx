"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ArrowLeft, Settings, LogOut, X, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FiltroMetricas } from "@/components/filtro-metricas"
import { useAuth } from "@/hooks/use-auth"
import { useFiltrosMetricas } from "@/hooks/use-filtros-metricas"
import { useDadosMetricas, useRealtimePedidos } from "@/hooks/use-dados-metricas"
import { supabase } from "@/lib/supabase/client"

const ABAS = [
  { href: "/metricas", label: "Visão geral" },
  { href: "/metricas/pedidos", label: "Pedidos" },
  { href: "/metricas/historico", label: "Histórico" },
]

export function MetricasShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const { periodo, setPeriodo, pousadasSelecionadas, togglePousada, limparPousadas } = useFiltrosMetricas()
  const { pousadas, pendencias } = useDadosMetricas()
  const [pendenciasFechadas, setPendenciasFechadas] = useState(false)
  useRealtimePedidos()

  const chavePendencias = pendencias.map((p) => p.id).join(",")
  useEffect(() => setPendenciasFechadas(false), [chavePendencias])

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
          <nav className="flex gap-1 rounded-lg bg-muted p-1 overflow-x-auto">
            {ABAS.map((aba) => {
              const ativa = pathname === aba.href
              return (
                <Link
                  key={aba.href}
                  href={aba.href}
                  className={
                    "tap rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
                    (ativa ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {aba.label}
                </Link>
              )
            })}
          </nav>
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
        {pendencias.length > 0 && !pendenciasFechadas && (
          <div className="mb-5 flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-3.5 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-medium">Pousadas sem pedido hoje ({pendencias.length})</p>
              <p className="mt-0.5 text-destructive/80">{pendencias.map((p) => p.nome).join(", ")}</p>
            </div>
            <button
              type="button"
              onClick={() => setPendenciasFechadas(true)}
              aria-label="Fechar aviso de pendências"
              className="tap flex size-6 shrink-0 items-center justify-center rounded-md text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}
        {children}
      </main>
    </div>
  )
}

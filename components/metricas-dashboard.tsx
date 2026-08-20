"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ShoppingBasket,
  Users,
  ListChecks,
  Home,
  TrendingUp,
  FileDown,
  Pencil,
  Ban,
  LogOut,
  Clock,
  Boxes,
} from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { getPedidos } from "@/lib/pedidos-api"
import { normalizarHorario, observacoesUnidade, type Pedido } from "@/lib/pedidos"
import { EditarPedidoDialog } from "@/components/editar-pedido-dialog"
import { CancelarPedidoDialog } from "@/components/cancelar-pedido-dialog"
import { ExportarDialog } from "@/components/exportar-dialog"
import { useAuth } from "@/hooks/use-auth"
import { POUSADAS } from "@/lib/pousadas"
import { supabase } from "@/lib/supabase/client"

type Periodo = "dia" | "semana" | "mes" | "ano"

const PERIODOS: { id: Periodo; label: string }[] = [
  { id: "dia", label: "Dia" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mês" },
  { id: "ano", label: "Ano" },
]

const LABEL_PERIODO: Record<Periodo, string> = {
  dia: "hoje",
  semana: "nos últimos 7 dias",
  mes: "neste mês",
  ano: "neste ano",
}

function dentroDoPeriodo(dataStr: string, periodo: Periodo): boolean {
  const data = new Date(dataStr)
  const agora = new Date()
  switch (periodo) {
    case "dia":
      return data.toDateString() === agora.toDateString()
    case "semana": {
      const limite = new Date(agora)
      limite.setDate(agora.getDate() - 6)
      limite.setHours(0, 0, 0, 0)
      return data >= limite
    }
    case "mes":
      return data.getMonth() === agora.getMonth() && data.getFullYear() === agora.getFullYear()
    case "ano":
      return data.getFullYear() === agora.getFullYear()
  }
}

function chaveGrafico(dataStr: string, periodo: Periodo): string {
  const data = new Date(dataStr)
  if (periodo === "dia") return `${String(data.getHours()).padStart(2, "0")}h`
  if (periodo === "semana") return data.toLocaleDateString("pt-BR", { weekday: "short" })
  if (periodo === "mes") return `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}`
  return data.toLocaleDateString("pt-BR", { month: "short" })
}

const chartConfig = {
  pedidos: { label: "Pedidos", color: "var(--chart-2)" },
  pessoas: { label: "Pessoas", color: "var(--chart-1)" },
} satisfies ChartConfig

function StatCard({ icon: Icon, valor, rotulo }: { icon: typeof Users; valor: number; rotulo: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="font-heading text-2xl font-bold tabular-nums text-card-foreground">{valor}</p>
        <p className="text-xs text-muted-foreground">{rotulo}</p>
      </div>
    </div>
  )
}

export function MetricasDashboard() {
  const router = useRouter()
  const { user, isAdmin } = useAuth()
  const { data: pedidos = [], isLoading, mutate } = useSWR<Pedido[]>("pedidos", getPedidos)
  const [periodo, setPeriodo] = useState<Periodo>("semana")
  const [pousadaFiltro, setPousadaFiltro] = useState<string>("todas")
  const [editando, setEditando] = useState<Pedido | null>(null)
  const [cancelando, setCancelando] = useState<Pedido | null>(null)
  const [exportando, setExportando] = useState(false)

  const filtrados = useMemo(
    () =>
      pedidos.filter(
        (p) => dentroDoPeriodo(p.created_at, periodo) && (pousadaFiltro === "todas" || (p.pousada ?? "Vale do Sol") === pousadaFiltro),
      ),
    [pedidos, periodo, pousadaFiltro],
  )

  const ativos = useMemo(() => filtrados.filter((p) => p.status !== "cancelado"), [filtrados])

  const totais = useMemo(() => {
    return ativos.reduce(
      (acc, p) => {
        acc.pedidos += 1
        acc.unidades += p.total_unidades
        acc.itens += p.total_itens
        acc.pessoas += p.total_pessoas ?? 0
        return acc
      },
      { pedidos: 0, unidades: 0, itens: 0, pessoas: 0 },
    )
  }, [ativos])

  const serie = useMemo(() => {
    const mapa = new Map<string, { periodo: string; pedidos: number; pessoas: number }>()
    for (const p of ativos) {
      const chave = chaveGrafico(p.created_at, periodo)
      const atual = mapa.get(chave) ?? { periodo: chave, pedidos: 0, pessoas: 0 }
      atual.pedidos += 1
      atual.pessoas += p.total_pessoas ?? 0
      mapa.set(chave, atual)
    }
    return Array.from(mapa.values())
  }, [ativos, periodo])

  const porUnidade = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const p of ativos) {
      for (const u of p.unidades ?? []) {
        mapa.set(u.unidade, (mapa.get(u.unidade) ?? 0) + 1)
      }
    }
    return Array.from(mapa.entries())
      .map(([unidade, total]) => ({ unidade, total }))
      .sort((a, b) => b.total - a.total)
  }, [ativos])

  const maxUnidade = porUnidade[0]?.total ?? 0

  const porPousada = useMemo(() => {
    const mapa = new Map<string, { pedidos: number; pessoas: number }>()
    for (const p of ativos) {
      const nome = p.pousada ?? "Vale do Sol"
      const atual = mapa.get(nome) ?? { pedidos: 0, pessoas: 0 }
      atual.pedidos += 1
      atual.pessoas += p.total_pessoas ?? 0
      mapa.set(nome, atual)
    }
    return Array.from(mapa.entries())
      .map(([nome, v]) => ({ nome, ...v }))
      .sort((a, b) => b.pedidos - a.pedidos)
  }, [ativos])

  const sair = async () => {
    await supabase.auth.signOut()
    router.replace("/auth")
  }

  return (
    <div className="min-h-svh bg-background pb-12">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-5">
          <Link
            href="/"
            className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Voltar aos pedidos"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <div className="mr-auto">
            <h1 className="font-heading text-xl font-bold text-card-foreground">Métricas</h1>
            <p className="text-sm text-muted-foreground">Fechamento de pedidos por período</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/estoque" className="hidden items-center gap-2 sm:inline-flex">
              <Button variant="ghost" className="gap-2">
                <Boxes className="size-4" aria-hidden="true" />
                Estoque
              </Button>
            </Link>
            {user?.email && <span className="hidden text-xs text-muted-foreground sm:inline">{user.email}</span>}
            <Button variant="ghost" onClick={sair} className="gap-2">
              <LogOut className="size-4" aria-hidden="true" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl border border-border bg-card p-1">
            {PERIODOS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriodo(p.id)}
                className={
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors " +
                  (periodo === p.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")
                }
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="inline-flex flex-wrap rounded-xl border border-border bg-card p-1">
            {[{ id: "todas", label: "Todas as pousadas" }, ...POUSADAS.map((p) => ({ id: p.nome, label: p.nome }))].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPousadaFiltro(opt.id)}
                className={
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors " +
                  (pousadaFiltro === opt.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" className="gap-2" disabled={filtrados.length === 0} onClick={() => setExportando(true)}>
              <FileDown className="size-4" aria-hidden="true" />
              Exportar
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando métricas...</p>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={ShoppingBasket} valor={totais.pedidos} rotulo={`Pedidos ${LABEL_PERIODO[periodo]}`} />
              <StatCard icon={Home} valor={totais.unidades} rotulo="Unidades atendidas" />
              <StatCard icon={Users} valor={totais.pessoas} rotulo="Pessoas no café" />
              <StatCard icon={ListChecks} valor={totais.itens} rotulo="Itens extras" />
            </div>

            {filtrados.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                <TrendingUp className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
                <p className="font-heading text-lg font-semibold text-card-foreground">Nenhum pedido {LABEL_PERIODO[periodo]}</p>
                <p className="mt-1 text-sm text-muted-foreground">Os envios feitos aparecerão aqui automaticamente.</p>
              </div>
            ) : (
              <>
                {porPousada.length > 0 && (
                  <section className="mb-6 rounded-2xl border border-border bg-card p-5">
                    <h2 className="mb-4 font-heading text-base font-semibold text-card-foreground">Resumo por pousada</h2>
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {porPousada.map((item) => (
                        <li key={item.nome} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                          <span className="text-sm font-medium text-card-foreground">{item.nome}</span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {item.pedidos} pedido(s) • {item.pessoas} pessoa(s)
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                  <section className="rounded-2xl border border-border bg-card p-5">
                    <h2 className="mb-4 font-heading text-base font-semibold text-card-foreground">Pedidos e pessoas por período</h2>
                    <ChartContainer config={chartConfig} className="h-64 w-full">
                      <BarChart data={serie} accessibilityLayer>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="periodo" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} width={28} allowDecimals={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="pedidos" fill="var(--color-pedidos)" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="pessoas" fill="var(--color-pessoas)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </section>

                  <section className="rounded-2xl border border-border bg-card p-5">
                    <h2 className="mb-4 font-heading text-base font-semibold text-card-foreground">Pedidos por unidade</h2>
                    <ul className="flex flex-col gap-3">
                      {porUnidade.map((item) => (
                        <li key={item.unidade} className="flex items-center gap-3">
                          <span className="w-16 shrink-0 text-sm font-medium text-card-foreground">{item.unidade}</span>
                          <div className="h-6 flex-1 overflow-hidden rounded-md bg-secondary">
                            <div
                              className="h-full rounded-md bg-accent"
                              style={{ width: `${maxUnidade ? (item.total / maxUnidade) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="w-6 shrink-0 text-right text-sm font-semibold tabular-nums text-card-foreground">
                            {item.total}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>

                <section className="mt-6 rounded-2xl border border-border bg-card p-5">
                  <h2 className="mb-4 font-heading text-base font-semibold text-card-foreground">Pedidos registrados</h2>
                  <ul className="flex flex-col gap-3">
                    {filtrados.map((p) => {
                      const cancelado = p.status === "cancelado"
                      return (
                        <li key={p.id} className={"rounded-xl border p-4 " + (cancelado ? "border-destructive/40 bg-destructive/5" : "border-border")}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-card-foreground">
                                #{p.id} · {p.pousada ?? "Vale do Sol"} — {p.saudacao || p.titulo}
                              </p>
                              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="size-3.5" aria-hidden="true" />
                                {new Date(p.created_at).toLocaleString("pt-BR")} • {p.total_unidades} cesta(s) • {p.total_pessoas} pessoa(s)
                                {cancelado ? " • Cancelado" : ""}
                              </p>
                            </div>
                            {isAdmin && !cancelado && (
                              <div className="flex gap-2">
                                <Button variant="outline" className="gap-2" onClick={() => setEditando(p)}>
                                  <Pencil className="size-4" aria-hidden="true" />
                                  Editar
                                </Button>
                                <Button variant="destructive" className="gap-2" onClick={() => setCancelando(p)}>
                                  <Ban className="size-4" aria-hidden="true" />
                                  Cancelar
                                </Button>
                              </div>
                            )}
                          </div>
                          <ul className="mt-3 flex flex-col gap-1">
                            {(p.unidades ?? []).map((u, i) => {
                              const obs = observacoesUnidade(u).join(", ").replace(/\*/g, "")
                              return (
                                <li key={`${p.id}-${i}`} className="text-xs text-muted-foreground">
                                  {normalizarHorario(u.horario)} • {u.unidade} — {u.pessoas} pessoa(s)
                                  {obs ? ` (${obs})` : ""}
                                </li>
                              )
                            })}
                          </ul>
                          {cancelado && p.motivo_cancelamento && (
                            <p className="mt-2 text-xs font-medium text-destructive">Motivo: {p.motivo_cancelamento}</p>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </section>
              </>
            )}
          </>
        )}
      </main>

      {editando && (
        <EditarPedidoDialog pedido={editando} onClose={() => setEditando(null)} onSalvo={() => void mutate()} />
      )}
      {cancelando && (
        <CancelarPedidoDialog pedido={cancelando} onClose={() => setCancelando(null)} onCancelado={() => void mutate()} />
      )}
      <ExportarDialog
        aberto={exportando}
        onClose={() => setExportando(false)}
        pedidos={filtrados}
        ranking={porUnidade}
        periodo={periodo}
        rotuloPeriodo={LABEL_PERIODO[periodo]}
      />
    </div>
  )
}

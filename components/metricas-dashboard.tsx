"use client"

import { useEffect, useMemo, useState } from "react"
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
  TrendingDown,
  FileDown,
  LogOut,
  Clock,
  Search,
  AlertTriangle,
  History,
  Settings,
  X,
} from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { getPedidos, getHistoricoPedidos } from "@/lib/pedidos-api"
import { getPousadas } from "@/lib/pousadas-api"
import { normalizarHorario, observacoesUnidade, type Pedido } from "@/lib/pedidos"
import { ExportarDialog } from "@/components/exportar-dialog"
import { useAuth } from "@/hooks/use-auth"
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

/** Mesmo tamanho de janela do período selecionado, mas imediatamente anterior — para o comparativo. */
function dentroDoPeriodoAnterior(dataStr: string, periodo: Periodo): boolean {
  const data = new Date(dataStr)
  const agora = new Date()
  switch (periodo) {
    case "dia": {
      const ontem = new Date(agora)
      ontem.setDate(agora.getDate() - 1)
      return data.toDateString() === ontem.toDateString()
    }
    case "semana": {
      const fim = new Date(agora)
      fim.setDate(agora.getDate() - 7)
      fim.setHours(0, 0, 0, 0)
      const inicio = new Date(agora)
      inicio.setDate(agora.getDate() - 13)
      inicio.setHours(0, 0, 0, 0)
      return data >= inicio && data < fim
    }
    case "mes": {
      const mesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1)
      return data.getMonth() === mesAnterior.getMonth() && data.getFullYear() === mesAnterior.getFullYear()
    }
    case "ano":
      return data.getFullYear() === agora.getFullYear() - 1
  }
}

function chaveGrafico(dataStr: string, periodo: Periodo): string {
  const data = new Date(dataStr)
  if (periodo === "dia") return `${String(data.getHours()).padStart(2, "0")}h`
  if (periodo === "semana") return data.toLocaleDateString("pt-BR", { weekday: "short" })
  if (periodo === "mes") return `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}`
  return data.toLocaleDateString("pt-BR", { month: "short" })
}

function delta(atual: number, anterior: number): number | null {
  if (anterior === 0) return atual > 0 ? 100 : null
  return Math.round(((atual - anterior) / anterior) * 100)
}

const chartConfig = {
  pedidos: { label: "Pedidos", color: "var(--chart-2)" },
  pessoas: { label: "Pessoas", color: "var(--chart-1)" },
} satisfies ChartConfig

function DeltaBadge({ valor }: { valor: number | null }) {
  if (valor === null) return null
  const positivo = valor >= 0
  const Icon = positivo ? TrendingUp : TrendingDown
  return (
    <span className={"inline-flex items-center gap-0.5 text-xs font-semibold " + (positivo ? "text-primary" : "text-destructive")}>
      <Icon className="size-3" aria-hidden="true" />
      {positivo ? "+" : ""}
      {valor}%
    </span>
  )
}

function StatCard({
  icon: Icon,
  valor,
  rotulo,
  comparativo,
}: {
  icon: typeof Users
  valor: number
  rotulo: string
  comparativo?: number | null
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div>
        <div className="flex items-center gap-1.5">
          <p className="font-heading text-2xl font-bold tabular-nums text-card-foreground">{valor}</p>
          {comparativo !== undefined && <DeltaBadge valor={comparativo} />}
        </div>
        <p className="text-xs text-muted-foreground">{rotulo}</p>
      </div>
    </div>
  )
}

export function MetricasDashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const { data: pedidos = [], isLoading, mutate } = useSWR<Pedido[]>("pedidos", getPedidos)
  const { data: pousadas = [] } = useSWR("pousadas", getPousadas)
  const { data: historico = [] } = useSWR("historico-pedidos", getHistoricoPedidos)
  const [periodo, setPeriodo] = useState<Periodo>("semana")
  const [pousadaFiltro, setPousadaFiltro] = useState<string>("todas")
  const [busca, setBusca] = useState("")
  const [dataExata, setDataExata] = useState("")
  const [exportando, setExportando] = useState(false)
  const [aba, setAba] = useState<"visao-geral" | "historico">("visao-geral")
  const [pendenciasFechadas, setPendenciasFechadas] = useState(false)

  // Atualiza sozinho quando qualquer pedido muda (a pousada edita/cancela em tempo real).
  useEffect(() => {
    const canal = supabase
      .channel("pedidos-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, () => void mutate())
      .subscribe()
    return () => {
      void supabase.removeChannel(canal)
    }
  }, [mutate])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return pedidos.filter((p) => {
      if (!dentroDoPeriodo(p.created_at, periodo)) return false
      if (pousadaFiltro !== "todas" && (p.pousada ?? "") !== pousadaFiltro) return false
      if (dataExata && new Date(p.created_at).toISOString().slice(0, 10) !== dataExata) return false
      if (termo) {
        const alvo = [p.pousada, p.saudacao, p.titulo, ...(p.unidades ?? []).map((u) => u.unidade)].join(" ").toLowerCase()
        if (!alvo.includes(termo)) return false
      }
      return true
    })
  }, [pedidos, periodo, pousadaFiltro, busca, dataExata])

  const ativos = useMemo(() => filtrados.filter((p) => p.status !== "cancelado"), [filtrados])

  const ativosAnteriores = useMemo(
    () =>
      pedidos.filter(
        (p) =>
          p.status !== "cancelado" &&
          dentroDoPeriodoAnterior(p.created_at, periodo) &&
          (pousadaFiltro === "todas" || (p.pousada ?? "") === pousadaFiltro),
      ),
    [pedidos, periodo, pousadaFiltro],
  )

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

  const totaisAnteriores = useMemo(() => {
    return ativosAnteriores.reduce(
      (acc, p) => {
        acc.pedidos += 1
        acc.pessoas += p.total_pessoas ?? 0
        return acc
      },
      { pedidos: 0, pessoas: 0 },
    )
  }, [ativosAnteriores])

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
      const nome = p.pousada ?? "—"
      const atual = mapa.get(nome) ?? { pedidos: 0, pessoas: 0 }
      atual.pedidos += 1
      atual.pessoas += p.total_pessoas ?? 0
      mapa.set(nome, atual)
    }
    return Array.from(mapa.entries())
      .map(([nome, v]) => ({ nome, ...v }))
      .sort((a, b) => b.pedidos - a.pedidos)
  }, [ativos])

  const pendencias = useMemo(() => {
    const hoje = new Date().toDateString()
    const pousadasComPedidoHoje = new Set(
      pedidos.filter((p) => p.status !== "cancelado" && new Date(p.created_at).toDateString() === hoje).map((p) => p.pousada_id),
    )
    return pousadas.filter((p) => !pousadasComPedidoHoje.has(p.id))
  }, [pedidos, pousadas])

  const chavePendencias = pendencias.map((p) => p.id).join(",")
  useEffect(() => {
    setPendenciasFechadas(false)
  }, [chavePendencias])

  const mapaPousadas = useMemo(() => new Map(pousadas.map((p) => [p.id, p.nome])), [pousadas])

  const sair = async () => {
    await supabase.auth.signOut()
    router.replace("/")
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
            <Link href="/administracao" className="hidden items-center gap-2 sm:inline-flex">
              <Button variant="ghost" className="gap-2">
                <Settings className="size-4" aria-hidden="true" />
                Administração
              </Button>
            </Link>
            {user?.email && <span className="hidden text-xs text-muted-foreground sm:inline">{user.email}</span>}
            <Button variant="ghost" onClick={sair} className="gap-2">
              <LogOut className="size-4" aria-hidden="true" />
              Sair
            </Button>
          </div>
        </div>
        <div className="mx-auto flex max-w-5xl gap-2 px-4 pb-4">
          <button
            type="button"
            onClick={() => setAba("visao-geral")}
            className={
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors " +
              (aba === "visao-geral" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")
            }
          >
            Visão geral
          </button>
          <button
            type="button"
            onClick={() => setAba("historico")}
            className={
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors " +
              (aba === "historico" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")
            }
          >
            <History className="size-3.5" aria-hidden="true" />
            Histórico de edições/cancelamentos
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {aba === "historico" ? (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 font-heading text-base font-semibold text-card-foreground">Histórico</h2>
            {historico.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma edição ou cancelamento registrado ainda.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {historico.map((h) => (
                  <li key={h.id} className="rounded-xl border border-border p-4">
                    <p className="text-sm font-semibold text-card-foreground">
                      Pedido #{h.pedido_id} · {h.pousada_id ? (mapaPousadas.get(h.pousada_id) ?? "Pousada removida") : "—"} —{" "}
                      {h.acao === "cancelado" ? "Cancelado" : "Editado"}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3.5" aria-hidden="true" />
                      {new Date(h.created_at).toLocaleString("pt-BR")}
                    </p>
                    {h.motivo && <p className="mt-1 text-xs font-medium text-destructive">Motivo: {h.motivo}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <>
            {pendencias.length > 0 && !pendenciasFechadas && (
              <div className="mb-6 flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <div className="flex-1">
                  <p className="font-medium">Pousadas sem pedido hoje ({pendencias.length})</p>
                  <p className="mt-0.5 text-destructive/80">{pendencias.map((p) => p.nome).join(", ")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPendenciasFechadas(true)}
                  aria-label="Fechar aviso de pendências"
                  className="flex size-6 shrink-0 items-center justify-center rounded-md text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            )}

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
                {[{ id: "todas", nome: "Todas as pousadas" }, ...pousadas].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPousadaFiltro(opt.id === "todas" ? "todas" : opt.nome)}
                    className={
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors " +
                      ((opt.id === "todas" ? pousadaFiltro === "todas" : pousadaFiltro === opt.nome)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground")
                    }
                  >
                    {opt.nome}
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

            <div className="mb-6 flex flex-wrap gap-3">
              <div className="flex min-w-48 flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
                <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por pousada, quarto/chalé ou saudação..."
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
                />
              </div>
              <input
                type="date"
                value={dataExata}
                onChange={(e) => setDataExata(e.target.value)}
                className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
              />
              {(busca || dataExata) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setBusca("")
                    setDataExata("")
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando métricas...</p>
            ) : (
              <>
                <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <StatCard
                    icon={ShoppingBasket}
                    valor={totais.pedidos}
                    rotulo={`Pedidos ${LABEL_PERIODO[periodo]}`}
                    comparativo={delta(totais.pedidos, totaisAnteriores.pedidos)}
                  />
                  <StatCard icon={Home} valor={totais.unidades} rotulo="Unidades atendidas" />
                  <StatCard
                    icon={Users}
                    valor={totais.pessoas}
                    rotulo="Pessoas no café"
                    comparativo={delta(totais.pessoas, totaisAnteriores.pessoas)}
                  />
                  <StatCard icon={ListChecks} valor={totais.itens} rotulo="Itens extras" />
                </div>

                {filtrados.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                    <TrendingUp className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
                    <p className="font-heading text-lg font-semibold text-card-foreground">Nenhum pedido encontrado</p>
                    <p className="mt-1 text-sm text-muted-foreground">Ajuste os filtros ou aguarde novos envios.</p>
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
                            <li
                              key={p.id}
                              className={"rounded-xl border p-4 " + (cancelado ? "border-destructive/40 bg-destructive/5" : "border-border")}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-card-foreground">
                                    #{p.id} · {p.pousada ?? "—"} — {p.saudacao || p.titulo}
                                  </p>
                                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Clock className="size-3.5" aria-hidden="true" />
                                    {new Date(p.created_at).toLocaleString("pt-BR")} • {p.total_unidades} cesta(s) • {p.total_pessoas} pessoa(s)
                                    {cancelado ? " • Cancelado" : ""}
                                  </p>
                                </div>
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
          </>
        )}
      </main>

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

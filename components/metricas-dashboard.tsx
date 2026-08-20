"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import {
  ArrowLeft,
  ShoppingBasket,
  Users,
  ListChecks,
  Home,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  FileDown,
  Star,
} from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { getPedidos, getPousadasComPedidoHoje } from "@/app/actions/pedidos"
import { exportarMetricas, getMetricasExportadas } from "@/app/actions/metricas"
import { getFeedbacks } from "@/app/actions/feedback"
import type { Pedido } from "@/lib/pedidos"
import { POUSADAS } from "@/lib/pousadas"
import { PERIODOS, LABEL_PERIODO, dentroDoPeriodo, chaveGrafico, type Periodo } from "@/lib/periodo"

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
  const { data: pedidos = [], isLoading } = useSWR<Pedido[]>("pedidos", getPedidos)
  const { data: pousadasComPedidoHoje = [] } = useSWR<string[]>("pousadas-hoje", getPousadasComPedidoHoje)
  const { data: metricasExportadas = [], mutate: recarregarExportadas } = useSWR("metricas-exportadas", getMetricasExportadas)
  const { data: feedbacks = [] } = useSWR("feedbacks", getFeedbacks)
  const [periodo, setPeriodo] = useState<Periodo>("semana")
  const [exportando, setExportando] = useState(false)

  const filtrados = useMemo(() => pedidos.filter((p) => dentroDoPeriodo(p.created_at, periodo)), [pedidos, periodo])

  const totais = useMemo(() => {
    return filtrados.reduce(
      (acc, p) => {
        acc.pedidos += 1
        acc.unidades += p.total_unidades
        acc.itens += p.total_itens
        acc.pessoas += p.total_pessoas ?? 0
        return acc
      },
      { pedidos: 0, unidades: 0, itens: 0, pessoas: 0 },
    )
  }, [filtrados])

  const serie = useMemo(() => {
    const mapa = new Map<string, { periodo: string; pedidos: number; pessoas: number }>()
    for (const p of filtrados) {
      const chave = chaveGrafico(p.created_at, periodo)
      const atual = mapa.get(chave) ?? { periodo: chave, pedidos: 0, pessoas: 0 }
      atual.pedidos += 1
      atual.pessoas += p.total_pessoas ?? 0
      mapa.set(chave, atual)
    }
    return Array.from(mapa.values())
  }, [filtrados, periodo])

  const porPousada = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const p of filtrados) {
      for (const u of p.unidades) {
        mapa.set(u.pousada, (mapa.get(u.pousada) ?? 0) + 1)
      }
    }
    return Array.from(mapa.entries())
      .map(([pousada, total]) => ({ pousada, total }))
      .sort((a, b) => b.total - a.total)
  }, [filtrados])

  const maxPousada = porPousada[0]?.total ?? 0

  // Previsão de demanda: média de pessoas por pedido de cada pousada no histórico completo.
  const previsao = useMemo(() => {
    const somaPessoas = new Map<string, number>()
    const contagem = new Map<string, number>()
    for (const p of pedidos) {
      for (const u of p.unidades) {
        somaPessoas.set(u.pousada, (somaPessoas.get(u.pousada) ?? 0) + u.pessoas)
        contagem.set(u.pousada, (contagem.get(u.pousada) ?? 0) + 1)
      }
    }
    return Array.from(contagem.entries())
      .map(([pousada, n]) => ({ pousada, media: (somaPessoas.get(pousada) ?? 0) / n }))
      .sort((a, b) => b.media - a.media)
      .slice(0, 5)
  }, [pedidos])

  const pendentes = useMemo(
    () => POUSADAS.filter((p) => !pousadasComPedidoHoje.includes(p.id)),
    [pousadasComPedidoHoje],
  )

  const mediaNota = useMemo(() => {
    if (feedbacks.length === 0) return 0
    return feedbacks.reduce((acc, f) => acc + f.nota, 0) / feedbacks.length
  }, [feedbacks])

  const handleExportar = async () => {
    if (exportando) return
    setExportando(true)
    try {
      await exportarMetricas(periodo)
      await recarregarExportadas()
    } finally {
      setExportando(false)
    }
  }

  return (
    <div className="min-h-svh bg-background pb-12">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-5">
          <Link
            href="/"
            className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Voltar aos pedidos"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <div>
            <h1 className="font-heading text-xl font-bold text-card-foreground">Métricas</h1>
            <p className="text-sm text-muted-foreground">Fechamento de pedidos por período</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {pendentes.length > 0 && (
          <div className="mb-6 flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium">Pousadas sem pedido hoje ({pendentes.length})</p>
              <p className="mt-0.5 text-destructive/80">{pendentes.map((p) => p.nome).join(", ")}</p>
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
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
          <Button onClick={handleExportar} disabled={exportando} variant="outline" className="gap-2 bg-transparent">
            <FileDown className="size-4" aria-hidden="true" />
            {exportando ? "Fechando..." : `Fechar período (${PERIODOS.find((p) => p.id === periodo)?.label})`}
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando métricas...</p>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={ShoppingBasket} valor={totais.pedidos} rotulo={`Pedidos ${LABEL_PERIODO[periodo]}`} />
              <StatCard icon={Home} valor={totais.unidades} rotulo="Quartos atendidos" />
              <StatCard icon={Users} valor={totais.pessoas} rotulo="Pessoas no café" />
              <StatCard icon={ListChecks} valor={totais.itens} rotulo="Itens extras" />
            </div>

            {filtrados.length === 0 ? (
              <div className="mb-6 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                <TrendingUp className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
                <p className="font-heading text-lg font-semibold text-card-foreground">Nenhum pedido {LABEL_PERIODO[periodo]}</p>
                <p className="mt-1 text-sm text-muted-foreground">Os envios feitos aparecerão aqui automaticamente.</p>
              </div>
            ) : (
              <div className="mb-6 grid gap-6 lg:grid-cols-2">
                <section className="rounded-2xl border border-border bg-card p-5">
                  <h2 className="mb-4 font-heading text-base font-semibold text-card-foreground">
                    Pedidos e pessoas por período
                  </h2>
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
                  <h2 className="mb-4 font-heading text-base font-semibold text-card-foreground">
                    Pousadas que mais pedem
                  </h2>
                  <ul className="flex flex-col gap-3">
                    {porPousada.map((item) => (
                      <li key={item.pousada} className="flex items-center gap-3">
                        <span className="w-24 shrink-0 truncate text-sm font-medium text-card-foreground">{item.pousada}</span>
                        <div className="h-6 flex-1 overflow-hidden rounded-md bg-secondary">
                          <div
                            className="h-full rounded-md bg-accent"
                            style={{ width: `${maxPousada ? (item.total / maxPousada) * 100 : 0}%` }}
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
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="mb-4 flex items-center gap-2 font-heading text-base font-semibold text-card-foreground">
                  <Sparkles className="size-4 text-primary" aria-hidden="true" />
                  Previsão de demanda
                </h2>
                {previsao.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem histórico suficiente ainda.</p>
                ) : (
                  <ul className="flex flex-col gap-2 text-sm">
                    {previsao.map((p) => (
                      <li key={p.pousada} className="flex items-center justify-between">
                        <span className="text-card-foreground">{p.pousada}</span>
                        <span className="font-medium text-muted-foreground">≈ {p.media.toFixed(1)} pessoas/pedido</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="mb-4 flex items-center gap-2 font-heading text-base font-semibold text-card-foreground">
                  <Star className="size-4 text-primary" aria-hidden="true" />
                  Feedbacks {feedbacks.length > 0 && `— média ${mediaNota.toFixed(1)}/5`}
                </h2>
                {feedbacks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum feedback recebido ainda via QR Code.</p>
                ) : (
                  <ul className="flex flex-col gap-2 text-sm">
                    {feedbacks.slice(0, 5).map((f) => (
                      <li key={f.id} className="flex items-start justify-between gap-2 border-b border-border pb-2 last:border-0">
                        <span className="text-card-foreground">{f.comentario || "Sem comentário"}</span>
                        <span className="shrink-0 font-medium text-primary">{f.nota}★</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {metricasExportadas.length > 0 && (
              <section className="mt-6 rounded-2xl border border-border bg-card p-5">
                <h2 className="mb-4 font-heading text-base font-semibold text-card-foreground">Fechamentos exportados</h2>
                <ul className="flex flex-col gap-2 text-sm">
                  {metricasExportadas.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-2 border-b border-border pb-2 last:border-0">
                      <span className="text-card-foreground">
                        {m.rotulo_periodo} — {m.total_pedidos} pedidos
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {m.created_at ? new Date(m.created_at).toLocaleString("pt-BR") : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}

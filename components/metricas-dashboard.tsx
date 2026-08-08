"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { ArrowLeft, ShoppingBasket, Users, ListChecks, Home, TrendingUp } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { getPedidos } from "@/app/actions/pedidos"
import type { Pedido } from "@/lib/pedidos"

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
  if (periodo === "dia") {
    return `${String(data.getHours()).padStart(2, "0")}h`
  }
  if (periodo === "semana") {
    return data.toLocaleDateString("pt-BR", { weekday: "short" })
  }
  if (periodo === "mes") {
    return `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}`
  }
  return data.toLocaleDateString("pt-BR", { month: "short" })
}

const chartConfig = {
  pedidos: { label: "Pedidos", color: "var(--chart-2)" },
  pessoas: { label: "Pessoas", color: "var(--chart-1)" },
} satisfies ChartConfig

function StatCard({
  icon: Icon,
  valor,
  rotulo,
}: {
  icon: typeof Users
  valor: number
  rotulo: string
}) {
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
  const [periodo, setPeriodo] = useState<Periodo>("semana")

  const filtrados = useMemo(
    () => pedidos.filter((p) => dentroDoPeriodo(p.created_at, periodo)),
    [pedidos, periodo],
  )

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

  const porUnidade = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const p of filtrados) {
      for (const u of p.unidades) {
        mapa.set(u.unidade, (mapa.get(u.unidade) ?? 0) + 1)
      }
    }
    return Array.from(mapa.entries())
      .map(([unidade, total]) => ({ unidade, total }))
      .sort((a, b) => b.total - a.total)
  }, [filtrados])

  const maxUnidade = porUnidade[0]?.total ?? 0

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
        {/* Seletor de período */}
        <div className="mb-6 inline-flex rounded-xl border border-border bg-card p-1">
          {PERIODOS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriodo(p.id)}
              className={
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors " +
                (periodo === p.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {p.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando métricas...</p>
        ) : (
          <>
            {/* Cards de resumo */}
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
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Gráfico de volume */}
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

                {/* Ranking por unidade */}
                <section className="rounded-2xl border border-border bg-card p-5">
                  <h2 className="mb-4 font-heading text-base font-semibold text-card-foreground">
                    Pedidos por unidade
                  </h2>
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
            )}
          </>
        )}
      </main>
    </div>
  )
}

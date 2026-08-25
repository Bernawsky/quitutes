"use client"

import { useState } from "react"
import { ShoppingBasket, Home, Users, ListChecks, TrendingUp, TrendingDown, FileDown } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { ExportarDialog } from "@/components/exportar-dialog"
import { RankingMetricas } from "@/components/ranking-metricas"
import { AoEntrar } from "@/components/ao-entrar"
import { useDadosMetricas, delta, LABEL_PERIODO } from "@/hooks/use-dados-metricas"

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
    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div>
        <div className="flex items-center gap-1.5">
          <p className="font-heading text-xl font-bold tabular-nums text-card-foreground">{valor}</p>
          {comparativo !== undefined && <DeltaBadge valor={comparativo} />}
        </div>
        <p className="text-xs text-muted-foreground">{rotulo}</p>
      </div>
    </div>
  )
}

export function VisaoGeralMetricas() {
  const [exportando, setExportando] = useState(false)
  const { periodo, filtrados, totais, totaisAnteriores, serie, porUnidade, porPousada, isLoading } = useDadosMetricas()

  const rankingUnidade = porUnidade.map((i) => ({ rotulo: i.unidade, valor: i.total }))
  const rankingPousada = porPousada.map((i) => ({ rotulo: i.nome, valor: i.pedidos, sub: `${i.pessoas}p` }))

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando métricas...</p>
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Fechamento de pedidos {LABEL_PERIODO[periodo]}</p>
        <Button variant="outline" size="sm" className="tap gap-2" disabled={filtrados.length === 0} onClick={() => setExportando(true)}>
          <FileDown className="size-3.5" aria-hidden="true" />
          Exportar
        </Button>
      </div>

      <AoEntrar className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
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
      </AoEntrar>

      {filtrados.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <TrendingUp className="mx-auto mb-2 size-6 text-muted-foreground" aria-hidden="true" />
          <p className="font-heading text-base font-semibold text-card-foreground">Nenhum pedido encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground">Ajuste os filtros ou aguarde novos envios.</p>
        </div>
      ) : (
        <AoEntrar className="grid gap-4 lg:grid-cols-2" atraso={80}>
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 font-heading text-sm font-semibold text-card-foreground">Pedidos e pessoas por período</h2>
            <ChartContainer config={chartConfig} className="h-56 w-full">
              <BarChart data={serie} accessibilityLayer>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="periodo" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} width={24} allowDecimals={false} fontSize={11} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="pedidos" fill="var(--color-pedidos)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pessoas" fill="var(--color-pessoas)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </section>

          <RankingMetricas porUnidade={rankingUnidade} porPousada={rankingPousada} />
        </AoEntrar>
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

"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { isFimDeSemana, nomeFeriado } from "@/lib/feriados"
import { dataLocal, type Pedido } from "@/lib/pedidos"

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"]
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

function paraISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** Classe de fundo por faixa de volume — quanto mais cestas no dia, mais forte a cor. */
function corPorContagem(n: number): string {
  if (n === 0) return ""
  if (n <= 2) return "bg-primary/15 text-primary"
  if (n <= 5) return "bg-primary/35 text-primary"
  if (n <= 9) return "bg-primary/60 text-primary-foreground"
  return "bg-primary text-primary-foreground"
}

/** Mapa de calor mensal: quantas cestas ativas cada dia tem, considerando o filtro de pousadas já aplicado nas Métricas. */
export function CalendarioHeatmap({ pedidos, pousadasSelecionadas }: { pedidos: Pedido[]; pousadasSelecionadas: string[] }) {
  const [mesVisivel, setMesVisivel] = useState(() => {
    const hoje = new Date()
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  })

  const ano = mesVisivel.getFullYear()
  const mes = mesVisivel.getMonth()
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay()
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()
  const celulas: (number | null)[] = [...Array(primeiroDiaSemana).fill(null), ...Array.from({ length: diasNoMes }, (_, i) => i + 1)]

  const contagemPorDia = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const p of pedidos) {
      if (p.status === "cancelado" || p.tipo === "buffet") continue
      if (pousadasSelecionadas.length > 0 && !pousadasSelecionadas.includes(p.pousada ?? "")) continue
      const data = dataLocal(p.data_pedido)
      if (data.getFullYear() !== ano || data.getMonth() !== mes) continue
      const iso = paraISO(data)
      mapa.set(iso, (mapa.get(iso) ?? 0) + 1)
    }
    return mapa
  }, [pedidos, pousadasSelecionadas, ano, mes])

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-sm font-semibold text-card-foreground">Cestas por dia — {MESES[mes]} {ano}</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMesVisivel(new Date(ano, mes - 1, 1))}
            aria-label="Mês anterior"
            className="tap flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setMesVisivel(new Date(ano, mes + 1, 1))}
            aria-label="Próximo mês"
            className="tap flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {DIAS_SEMANA.map((d, i) => (
          <span key={i} className="text-[11px] font-medium text-muted-foreground">
            {d}
          </span>
        ))}

        {celulas.map((dia, i) => {
          if (dia === null) return <span key={`vazio-${i}`} />
          const iso = paraISO(new Date(ano, mes, dia))
          const contagem = contagemPorDia.get(iso) ?? 0
          const diaEspecial = Boolean(nomeFeriado(iso) || isFimDeSemana(iso))
          return (
            <div key={iso} className="mx-auto flex flex-col items-center gap-0.5 py-0.5">
              <span
                title={contagem > 0 ? `${contagem} cesta(s)` : undefined}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-xs font-medium text-foreground transition-colors",
                  corPorContagem(contagem),
                  contagem === 0 && diaEspecial && "ring-1 ring-sky-300",
                )}
              >
                {dia}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
        Menos
        <span className="size-3 rounded-full bg-muted" />
        <span className="size-3 rounded-full bg-primary/15" />
        <span className="size-3 rounded-full bg-primary/35" />
        <span className="size-3 rounded-full bg-primary/60" />
        <span className="size-3 rounded-full bg-primary" />
        Mais
      </div>
    </section>
  )
}

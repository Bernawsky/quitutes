"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, ShoppingBasket, UtensilsCrossed, Ban } from "lucide-react"
import { cn } from "@/lib/utils"
import { isFimDeSemana, nomeFeriado } from "@/lib/feriados"
import { dataLocal, rotuloData, type Pedido } from "@/lib/pedidos"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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

/**
 * Mapa de calor mensal: quantas cestas ativas cada dia tem, considerando o filtro de pousadas
 * já aplicado nas Métricas. Clicar num dia abre uma prévia dos pedidos daquele dia — cestas
 * e vouchers de Buffet (um pedido nunca é os dois: o Buffet substitui a cesta, não soma a ela).
 */
export function CalendarioHeatmap({ pedidos, pousadasSelecionadas }: { pedidos: Pedido[]; pousadasSelecionadas: string[] }) {
  const [mesVisivel, setMesVisivel] = useState(() => {
    const hoje = new Date()
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  })
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null)

  const ano = mesVisivel.getFullYear()
  const mes = mesVisivel.getMonth()
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay()
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()
  const celulas: (number | null)[] = [...Array(primeiroDiaSemana).fill(null), ...Array.from({ length: diasNoMes }, (_, i) => i + 1)]

  const pedidosDoMes = useMemo(
    () =>
      pedidos.filter((p) => {
        if (pousadasSelecionadas.length > 0 && !pousadasSelecionadas.includes(p.pousada ?? "")) return false
        const data = dataLocal(p.data_pedido)
        return data.getFullYear() === ano && data.getMonth() === mes
      }),
    [pedidos, pousadasSelecionadas, ano, mes],
  )

  const contagemPorDia = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const p of pedidosDoMes) {
      if (p.status === "cancelado" || p.tipo === "buffet") continue
      const iso = paraISO(dataLocal(p.data_pedido))
      mapa.set(iso, (mapa.get(iso) ?? 0) + 1)
    }
    return mapa
  }, [pedidosDoMes])

  const pedidosPorDia = useMemo(() => {
    const mapa = new Map<string, Pedido[]>()
    for (const p of pedidosDoMes) {
      const iso = paraISO(dataLocal(p.data_pedido))
      const lista = mapa.get(iso) ?? []
      lista.push(p)
      mapa.set(iso, lista)
    }
    return mapa
  }, [pedidosDoMes])

  const pedidosDoDiaSelecionado = diaSelecionado ? (pedidosPorDia.get(diaSelecionado) ?? []) : []

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
          const temPedido = (pedidosPorDia.get(iso)?.length ?? 0) > 0
          const diaEspecial = Boolean(nomeFeriado(iso) || isFimDeSemana(iso))
          return (
            <div key={iso} className="mx-auto flex flex-col items-center gap-0.5 py-0.5">
              <button
                type="button"
                disabled={!temPedido}
                onClick={() => setDiaSelecionado(iso)}
                title={contagem > 0 ? `${contagem} cesta(s)` : undefined}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-xs font-medium text-foreground transition-colors",
                  temPedido && "tap cursor-pointer hover:ring-2 hover:ring-primary/40",
                  corPorContagem(contagem),
                  contagem === 0 && diaEspecial && "ring-1 ring-sky-300",
                )}
              >
                {dia}
              </button>
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

      <Dialog open={diaSelecionado !== null} onOpenChange={(aberto) => !aberto && setDiaSelecionado(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{diaSelecionado ? rotuloData(diaSelecionado) : ""}</DialogTitle>
          </DialogHeader>
          <ul className="flex flex-col gap-2">
            {pedidosDoDiaSelecionado.map((p) => {
              const buffet = p.tipo === "buffet"
              const cancelado = p.status === "cancelado"
              return (
                <li
                  key={p.id}
                  className={cn(
                    "flex items-start gap-2.5 rounded-lg border border-border p-2.5",
                    cancelado && "bg-destructive/5",
                  )}
                >
                  {buffet ? (
                    <UtensilsCrossed className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  ) : (
                    <ShoppingBasket className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-card-foreground">
                      {p.pousada ?? "—"}
                      <span className="rounded-md bg-accent/40 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-accent-foreground uppercase">
                        {buffet ? "Buffet" : "Cesta"}
                      </span>
                      {cancelado && (
                        <span className="flex items-center gap-1 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                          <Ban className="size-3" aria-hidden="true" />
                          Cancelado
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {buffet
                        ? `${p.saudacao || p.titulo} — ${p.total_pessoas} pessoa(s)`
                        : `${p.total_unidades} cesta(s) — ${p.total_pessoas} pessoa(s)`}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </DialogContent>
      </Dialog>
    </section>
  )
}

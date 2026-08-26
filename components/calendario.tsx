"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { isFimDeSemana, nomeFeriado } from "@/lib/feriados"

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"]
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

function paraISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function deISO(iso: string): Date {
  const [ano, mes, dia] = iso.split("-").map(Number)
  return new Date(ano!, mes! - 1, dia!)
}

type CalendarioProps = {
  /** Data selecionada, formato yyyy-mm-dd. */
  valor?: string | null
  onSelecionar: (data: string) => void
  /** Datas fora desse intervalo (yyyy-mm-dd) aparecem apagadas e não podem ser escolhidas. */
  minimo?: string
  maximo?: string
  /** Quando true, só permite escolher fins de semana e feriados nacionais (ex: dias de Buffet). */
  somenteDiasBuffet?: boolean
  /** Datas (yyyy-mm-dd) que já têm pedido — pintam a bolinha do dia (verde no passado, amarelo no futuro). */
  datasComPedido?: Iterable<string>
}

/** Calendário mensal no estilo do app Calendário do iPhone: grade de dias, hoje marcado, dia selecionado em círculo cheio. */
export function Calendario({ valor, onSelecionar, minimo, maximo, somenteDiasBuffet, datasComPedido }: CalendarioProps) {
  const comPedido = new Set(datasComPedido ?? [])
  const hojeISO = paraISO(new Date())
  const [mesVisivel, setMesVisivel] = useState(() => {
    const base = valor ? deISO(valor) : new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })

  const ano = mesVisivel.getFullYear()
  const mes = mesVisivel.getMonth()
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay()
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()

  const celulas: (number | null)[] = [...Array(primeiroDiaSemana).fill(null), ...Array.from({ length: diasNoMes }, (_, i) => i + 1)]

  const mudarMes = (delta: number) => setMesVisivel(new Date(ano, mes + delta, 1))

  return (
    <div className="w-full select-none">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => mudarMes(-1)}
          aria-label="Mês anterior"
          className="tap flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted active:bg-muted"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <p className="font-heading text-sm font-semibold text-card-foreground">
          {MESES[mes]} {ano}
        </p>
        <button
          type="button"
          onClick={() => mudarMes(1)}
          aria-label="Próximo mês"
          className="tap flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted active:bg-muted"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
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
          const hoje = iso === hojeISO
          const selecionado = iso === valor
          const feriado = nomeFeriado(iso)
          const fimDeSemana = isFimDeSemana(iso)
          const diaEspecial = Boolean(feriado || fimDeSemana)
          const temPedido = comPedido.has(iso)
          const pedidoPassado = temPedido && iso < hojeISO
          const pedidoFuturo = temPedido && iso >= hojeISO
          const foraDoIntervalo = (minimo && iso < minimo) || (maximo && iso > maximo)
          const desabilitado = foraDoIntervalo || (somenteDiasBuffet && !feriado && !fimDeSemana)

          return (
            <button
              key={iso}
              type="button"
              disabled={Boolean(desabilitado)}
              onClick={() => onSelecionar(iso)}
              title={feriado ?? undefined}
              className={cn(
                "tap mx-auto flex size-9 items-center justify-center rounded-full text-sm transition-colors",
                selecionado
                  ? "bg-primary font-semibold text-primary-foreground"
                  : pedidoPassado
                    ? "bg-green-100 text-green-900 hover:bg-green-200"
                    : pedidoFuturo
                      ? "bg-yellow-100 text-yellow-900 hover:bg-yellow-200"
                      : hoje
                        ? "text-primary hover:bg-muted"
                        : "text-foreground hover:bg-muted",
                !selecionado && hoje && "font-semibold ring-1 ring-primary/50",
                !selecionado && !hoje && diaEspecial && "ring-1 ring-sky-300",
                desabilitado && "pointer-events-none text-muted-foreground/30",
              )}
            >
              {dia}
            </button>
          )
        })}
      </div>
    </div>
  )
}

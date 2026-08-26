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
}

/** Calendário mensal no estilo do app Calendário do iPhone: grade de dias, hoje marcado, dia selecionado em círculo cheio. */
export function Calendario({ valor, onSelecionar, minimo, maximo, somenteDiasBuffet }: CalendarioProps) {
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
          const foraDoIntervalo = (minimo && iso < minimo) || (maximo && iso > maximo)
          const desabilitado = foraDoIntervalo || (somenteDiasBuffet && !feriado && !fimDeSemana)

          return (
            <div key={iso} className="relative mx-auto flex flex-col items-center">
              <button
                type="button"
                disabled={Boolean(desabilitado)}
                onClick={() => onSelecionar(iso)}
                title={feriado ?? undefined}
                className={cn(
                  "tap flex size-9 items-center justify-center rounded-full text-sm transition-colors",
                  selecionado
                    ? "bg-primary font-semibold text-primary-foreground"
                    : hoje
                      ? "font-semibold text-primary ring-1 ring-primary/50"
                      : "text-foreground hover:bg-muted",
                  desabilitado && "pointer-events-none text-muted-foreground/30",
                )}
              >
                {dia}
              </button>
              {(feriado || fimDeSemana) && !selecionado && (
                <span
                  className={cn("absolute bottom-0.5 size-1 rounded-full", feriado ? "bg-accent" : "bg-muted-foreground/40")}
                  aria-hidden="true"
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

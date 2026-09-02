"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"]
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

function paraISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

type CalendarioMultiProps = {
  aberto: boolean
  onFechar: () => void
  /** Datas (yyyy-mm-dd) já selecionadas antes de abrir o calendário. */
  selecionadas: string[]
  /** Chamado ao clicar em "Concluir", com a lista final de datas selecionadas. */
  onConcluir: (datas: string[]) => void
}

/**
 * Mini calendário com seleção múltipla de dias (navega mês a mês). Usado pra escolher quais dias vão ter
 * produção — substitui o botão "Adicionar dia" da calculadora.
 */
export function CalendarioMulti({ aberto, onFechar, selecionadas, onConcluir }: CalendarioMultiProps) {
  const [selecao, setSelecao] = useState<Set<string>>(() => new Set(selecionadas))
  const [mesVisivel, setMesVisivel] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))

  const hojeISO = paraISO(new Date())
  const ano = mesVisivel.getFullYear()
  const mes = mesVisivel.getMonth()
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay()
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()
  const celulas: (number | null)[] = [...Array(primeiroDiaSemana).fill(null), ...Array.from({ length: diasNoMes }, (_, i) => i + 1)]

  const mudarMes = (delta: number) => setMesVisivel(new Date(ano, mes + delta, 1))

  function alternar(iso: string) {
    setSelecao((atual) => {
      const proxima = new Set(atual)
      if (proxima.has(iso)) proxima.delete(iso)
      else proxima.add(iso)
      return proxima
    })
  }

  function abrirOuFechar(novoAberto: boolean) {
    if (!novoAberto) {
      setSelecao(new Set(selecionadas))
      onFechar()
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={abrirOuFechar}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Selecionar dias de produção</DialogTitle>
          <DialogDescription>Escolha um ou mais dias. Dá pra navegar entre meses.</DialogDescription>
        </DialogHeader>

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
              const selecionado = selecao.has(iso)

              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => alternar(iso)}
                  className={cn(
                    "tap mx-auto flex size-9 items-center justify-center rounded-full text-sm transition-colors",
                    selecionado ? "bg-primary font-semibold text-primary-foreground" : "text-foreground hover:bg-muted",
                    !selecionado && hoje && "font-semibold ring-1 ring-primary/50",
                  )}
                >
                  {dia}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {selecao.size === 0 ? "Nenhum dia selecionado" : `${selecao.size} dia(s) selecionado(s)`}
          </p>
          <button
            type="button"
            onClick={() => onConcluir([...selecao].sort())}
            className="tap rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Concluir
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { Filter, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import type { Periodo } from "@/hooks/use-filtros-metricas"

const PERIODOS: { id: Periodo; label: string }[] = [
  { id: "dia", label: "Dia" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mês" },
  { id: "ano", label: "Ano" },
]

type Pousada = { id: string; nome: string }

export function FiltroMetricas({
  periodo,
  setPeriodo,
  pousadas,
  pousadasSelecionadas,
  togglePousada,
  limparPousadas,
}: {
  periodo: Periodo
  setPeriodo: (p: Periodo) => void
  pousadas: Pousada[]
  pousadasSelecionadas: string[]
  togglePousada: (nome: string) => void
  limparPousadas: () => void
}) {
  const totalAtivos = pousadasSelecionadas.length

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" className="tap gap-2">
            <Filter className="size-4" aria-hidden="true" />
            Filtros
            {totalAtivos > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                {totalAtivos}
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent>
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Período</p>
            <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1">
              {PERIODOS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriodo(p.id)}
                  className={
                    "tap rounded-md py-1.5 text-xs font-medium transition-colors " +
                    (periodo === p.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Pousadas</p>
              {totalAtivos > 0 && (
                <button type="button" onClick={limparPousadas} className="text-xs font-medium text-primary hover:underline">
                  Limpar
                </button>
              )}
            </div>
            <div className="flex max-h-48 flex-col gap-0.5 overflow-y-auto">
              {pousadas.map((p) => {
                const marcado = pousadasSelecionadas.includes(p.nome)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePousada(p.nome)}
                    aria-pressed={marcado}
                    className="tap flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    <span
                      className={
                        "flex size-4 shrink-0 items-center justify-center rounded-[4px] border " +
                        (marcado ? "border-primary bg-primary text-primary-foreground" : "border-input")
                      }
                    >
                      {marcado && <Check className="size-3" aria-hidden="true" />}
                    </span>
                    {p.nome}
                  </button>
                )
              })}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{totalAtivos === 0 ? "Todas as pousadas" : `${totalAtivos} selecionada(s)`}</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

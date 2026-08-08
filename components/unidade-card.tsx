aça c"use client"

import { Clock, Check, X, BedDouble, Users, Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { HORARIOS, OBSERVACOES } from "@/lib/pedidos"

export type Unidade = {
  id: number
  nome: string
  isSuite?: boolean
  horario: string
  pessoas: number
  observacoes: string[]
}

type UnidadeCardProps = {
  unidade: Unidade
  onHorario: (id: number, horario: string) => void
  onPessoas: (id: number, pessoas: number) => void
  onToggleObs: (id: number, obs: string) => void
  onLimpar: (id: number) => void
}

export function UnidadeCard({ unidade, onHorario, onPessoas, onToggleObs, onLimpar }: UnidadeCardProps) {
  const ativo = Boolean(unidade.horario || unidade.pessoas > 0 || unidade.observacoes.length > 0)

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border p-5 transition-colors",
        ativo ? "border-accent bg-accent shadow-sm" : "border-border bg-card",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg text-sm font-semibold",
              ativo ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {unidade.isSuite ? <BedDouble className="size-4" aria-hidden="true" /> : unidade.id}
          </span>
          <h2 className="font-heading text-lg font-semibold text-card-foreground">{unidade.nome}</h2>
        </div>
        {ativo ? (
          <button
            type="button"
            onClick={() => onLimpar(unidade.id)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden="true" />
            Limpar
          </button>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">Vazio</span>
        )}
      </div>

      {/* Horário */}
      <div className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Clock className="size-3.5" aria-hidden="true" />
          Horário
        </span>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={`Horário ${unidade.nome}`}>
          {HORARIOS.map((h) => {
            const selecionado = unidade.horario === h
            return (
              <button
                key={h}
                type="button"
                role="radio"
                aria-checked={selecionado}
                onClick={() => onHorario(unidade.id, selecionado ? "" : h)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  selecionado
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background text-foreground hover:border-primary/50",
                )}
              >
                {h}
              </button>
            )
          })}
        </div>
      </div>

      {/* Pessoas para o café */}
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Users className="size-3.5" aria-hidden="true" />
          Pessoas no café
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPessoas(unidade.id, Math.max(0, unidade.pessoas - 1))}
            disabled={unidade.pessoas <= 0}
            aria-label={`Diminuir pessoas ${unidade.nome}`}
            className="flex size-8 items-center justify-center rounded-lg border border-input bg-background text-foreground transition-colors hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <span className="w-6 text-center text-sm font-semibold tabular-nums text-foreground" aria-live="polite">
            {unidade.pessoas}
          </span>
          <button
            type="button"
            onClick={() => onPessoas(unidade.id, unidade.pessoas + 1)}
            aria-label={`Aumentar pessoas ${unidade.nome}`}
            className="flex size-8 items-center justify-center rounded-lg border border-input bg-background text-foreground transition-colors hover:border-primary/50"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Observações */}
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-xs font-medium text-muted-foreground">Observações</legend>
        <div className="flex flex-col gap-1.5">
          {OBSERVACOES.map((obs) => {
            const marcado = unidade.observacoes.includes(obs)
            return (
              <label
                key={obs}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                  marcado
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-input bg-background text-foreground hover:border-primary/40",
                )}
              >
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                    marcado ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background",
                  )}
                  aria-hidden="true"
                >
                  {marcado && <Check className="size-3" strokeWidth={3} />}
                </span>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={marcado}
                  onChange={() => onToggleObs(unidade.id, obs)}
                />
                {obs}
              </label>
            )
          })}
        </div>
      </fieldset>

      {ativo && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
          <Check className="size-3.5" aria-hidden="true" />
          Incluído no envio
        </div>
      )}
    </div>
  )
}

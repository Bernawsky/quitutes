"use client"

import { Clock, Check, X, BedDouble, Users, Minus, Plus, Coffee, Citrus, Leaf, Flame, Egg } from "lucide-react"
import { cn } from "@/lib/utils"
import { HORARIOS, ITENS, type Itens } from "@/lib/pedidos"

const ICONES: Record<string, typeof Coffee> = {
  cafe: Coffee,
  suco: Citrus,
  cha: Leaf,
  aguaQuente: Flame,
  ovos: Egg,
}

export type Unidade = {
  id: number
  nome: string
  isSuite?: boolean
  horario: string
  pessoas: number
  itens: Itens
}

type UnidadeCardProps = {
  unidade: Unidade
  onHorario: (id: number, horario: string) => void
  onPessoas: (id: number, pessoas: number) => void
  onItem: (id: number, key: string, qtd: number) => void
  onLimpar: (id: number) => void
}

function Stepper({
  valor,
  onChange,
  rotulo,
}: {
  valor: number
  onChange: (v: number) => void
  rotulo: string
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, valor - 1))}
        disabled={valor <= 0}
        aria-label={`Diminuir ${rotulo}`}
        className="flex size-8 items-center justify-center rounded-lg border border-input bg-background text-foreground transition-colors hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <span className="w-6 text-center text-sm font-semibold tabular-nums text-foreground" aria-live="polite">
        {valor}
      </span>
      <button
        type="button"
        onClick={() => onChange(valor + 1)}
        aria-label={`Aumentar ${rotulo}`}
        className="flex size-8 items-center justify-center rounded-lg border border-input bg-background text-foreground transition-colors hover:border-primary/50"
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

export function UnidadeCard({ unidade, onHorario, onPessoas, onItem, onLimpar }: UnidadeCardProps) {
  const totalItens = Object.values(unidade.itens).reduce((a, b) => a + (b || 0), 0)
  const ativo = Boolean(unidade.horario || unidade.pessoas > 0 || totalItens > 0)

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
      <div className="flex items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-2">
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Users className="size-4 text-primary" aria-hidden="true" />
          Pessoas no café
        </span>
        <Stepper
          valor={unidade.pessoas}
          onChange={(v) => onPessoas(unidade.id, v)}
          rotulo={`pessoas ${unidade.nome}`}
        />
      </div>

      {/* Itens */}
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-xs font-medium text-muted-foreground">Itens</legend>
        <div className="flex flex-col gap-1.5">
          {ITENS.map((it) => {
            const Icone = ICONES[it.key]
            const qtd = unidade.itens[it.key] ?? 0
            return (
              <div
                key={it.key}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                  qtd > 0 ? "border-primary/40 bg-primary/10 text-foreground" : "border-input bg-background text-foreground",
                )}
              >
                <span className="flex items-center gap-2">
                  {Icone && (
                    <Icone
                      className={cn("size-4 shrink-0", qtd > 0 ? "text-primary" : "text-muted-foreground")}
                      aria-hidden="true"
                    />
                  )}
                  {it.label}
                </span>
                <Stepper
                  valor={qtd}
                  onChange={(v) => onItem(unidade.id, it.key, v)}
                  rotulo={`${it.label} ${unidade.nome}`}
                />
              </div>
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

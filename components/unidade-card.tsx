"use client"

import {
  Clock,
  Check,
  X,
  BedDouble,
  Users,
  Minus,
  Plus,
  Coffee,
  Citrus,
  Leaf,
  Flame,
  Egg,
  AlertCircle,
  MessageSquare,
  Sprout,
  Salad,
  Wheat,
  Milk,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ITENS, DIETAS, type Itens } from "@/lib/pedidos"

const ICONES: Record<string, typeof Coffee> = {
  cafe: Coffee,
  suco: Citrus,
  cha: Leaf,
  aguaQuente: Flame,
  ovos: Egg,
}

const ICONES_DIETA: Record<string, typeof Coffee> = {
  vegana: Sprout,
  vegetariana: Salad,
  semGluten: Wheat,
  semLactose: Milk,
}

export type Unidade = {
  id: number
  nome: string
  isSuite?: boolean
  horario: string
  pessoas: number
  itens: Itens
  dietas: string[]
  observacao: string
}

type UnidadeCardProps = {
  unidade: Unidade
  /** Horários disponíveis para a pousada desta unidade. Quando há só um, fica fixo/selecionado. */
  horarios: readonly string[]
  mostrarErros?: boolean
  onHorario: (id: number, horario: string) => void
  onPessoas: (id: number, pessoas: number) => void
  onItem: (id: number, key: string, qtd: number) => void
  onDieta: (id: number, key: string, ativo: boolean) => void
  onObservacao: (id: number, texto: string) => void
  onLimpar: (id: number) => void
}

function Stepper({
  valor,
  onChange,
  rotulo,
  invalido,
}: {
  valor: number
  onChange: (v: number) => void
  rotulo: string
  invalido?: boolean
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
      <span
        className={cn("w-6 text-center text-sm font-semibold tabular-nums", invalido ? "text-destructive" : "text-foreground")}
        aria-live="polite"
      >
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

export function UnidadeCard({
  unidade,
  horarios,
  mostrarErros = false,
  onHorario,
  onPessoas,
  onItem,
  onDieta,
  onObservacao,
  onLimpar,
}: UnidadeCardProps) {
  const ativo =
    Boolean(unidade.horario) ||
    unidade.pessoas > 0 ||
    Object.values(unidade.itens).some((q) => q > 0) ||
    (unidade.dietas?.length ?? 0) > 0 ||
    Boolean(unidade.observacao?.trim())

  const erroHorario = ativo && !unidade.horario
  const erroPessoas = ativo && !(unidade.pessoas > 0)
  const invalido = erroHorario || erroPessoas
  const exibirErro = mostrarErros && invalido

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border p-5 transition-colors",
        exibirErro ? "border-destructive bg-card shadow-sm" : ativo ? "border-accent bg-accent shadow-sm" : "border-border bg-card",
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

      {/* Horário (obrigatório quando a unidade está selecionada; fixo quando a pousada só tem um) */}
      <div className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Clock className="size-3.5" aria-hidden="true" />
          Horário {horarios.length > 1 && <span aria-hidden="true">*</span>}
          {horarios.length === 1 && <span className="font-normal">(fixo)</span>}
        </span>
        <div
          className={cn("grid gap-2", horarios.length > 1 ? "grid-cols-2" : "grid-cols-1")}
          role="radiogroup"
          aria-required="true"
          aria-invalid={exibirErro && erroHorario}
          aria-label={`Horário ${unidade.nome}${horarios.length > 1 ? " (obrigatório)" : ""}`}
        >
          {horarios.map((h) => {
            const selecionado = unidade.horario === h
            const fixo = horarios.length === 1
            return (
              <button
                key={h}
                type="button"
                role="radio"
                aria-checked={selecionado}
                disabled={fixo}
                onClick={() => {
                  if (fixo) return
                  onHorario(unidade.id, selecionado ? "" : h)
                }}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-bold transition-colors",
                  selecionado
                    ? "border-primary bg-primary text-primary-foreground disabled:opacity-100"
                    : mostrarErros && erroHorario
                      ? "border-destructive bg-background text-foreground hover:border-destructive"
                      : "border-input bg-background text-foreground hover:border-primary/50",
                )}
              >
                {h}
              </button>
            )
          })}
        </div>
        {mostrarErros && erroHorario && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-destructive" role="alert">
            <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
            Selecione um horário
          </p>
        )}
      </div>

      {/* Pessoas para o café (obrigatório quando a unidade está selecionada) */}
      <div className="flex flex-col gap-1.5">
        <div
          className={cn(
            "flex items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2",
            mostrarErros && erroPessoas ? "border-destructive" : "border-input",
          )}
        >
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Users className="size-4 text-primary" aria-hidden="true" />
            Pessoas no café <span aria-hidden="true">*</span>
          </span>
          <Stepper
            valor={unidade.pessoas}
            onChange={(v) => onPessoas(unidade.id, v)}
            rotulo={`pessoas ${unidade.nome}`}
            invalido={mostrarErros && erroPessoas}
          />
        </div>
        {mostrarErros && erroPessoas && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-destructive" role="alert">
            <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
            Informe a quantidade de pessoas
          </p>
        )}
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
                  {Icone && <Icone className={cn("size-4 shrink-0", qtd > 0 ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />}
                  {it.label}
                </span>
                <Stepper valor={qtd} onChange={(v) => onItem(unidade.id, it.key, v)} rotulo={`${it.label} ${unidade.nome}`} />
              </div>
            )
          })}
        </div>
      </fieldset>

      {/* Tipo de cesta (vegana / sem glúten / sem lactose) */}
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-xs font-medium text-muted-foreground">Tipo de cesta</legend>
        <div className="flex flex-wrap gap-2">
          {DIETAS.map((d) => {
            const Icone = ICONES_DIETA[d.key]
            const marcado = unidade.dietas?.includes(d.key) ?? false
            return (
              <button
                key={d.key}
                type="button"
                aria-pressed={marcado}
                onClick={() => onDieta(unidade.id, d.key, !marcado)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                  marcado ? "border-primary bg-primary/10 text-foreground" : "border-input bg-background text-muted-foreground hover:border-primary/50",
                )}
              >
                {Icone && <Icone className={cn("size-3.5", marcado ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />}
                {d.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* Observação livre */}
      <label className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <MessageSquare className="size-3.5" aria-hidden="true" />
          Observação
        </span>
        <textarea
          rows={2}
          maxLength={280}
          value={unidade.observacao ?? ""}
          onChange={(e) => onObservacao(unidade.id, e.target.value)}
          placeholder="Ex: sem açúcar, entregar na varanda..."
          className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </label>

      {ativo &&
        (invalido ? (
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <AlertCircle className="size-3.5" aria-hidden="true" />
            Preencha horário e pessoas para enviar
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <Check className="size-3.5" aria-hidden="true" />
            Incluído no envio
          </div>
        ))}
    </div>
  )
}

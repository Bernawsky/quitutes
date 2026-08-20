"use client"

import { Clock, X, Users, Minus, Plus, Coffee, Citrus, Leaf, Flame, Egg, DoorOpen, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ITENS, type Itens } from "@/lib/pedidos"
import { HORARIOS_DISPONIVEIS, type Pousada } from "@/lib/pousadas"

const ICONES: Record<string, typeof Coffee> = {
  cafe: Coffee,
  suco: Citrus,
  cha: Leaf,
  aguaQuente: Flame,
  ovos: Egg,
}

export type QuartoPedido = {
  quartoId: string
  quarto: string
  pessoas: number
  itens: Itens
}

export type PousadaPedido = {
  pousada: Pousada
  horario: string
  quartos: QuartoPedido[]
}

type PousadaCardProps = {
  pedido: PousadaPedido
  onHorario: (pousadaId: string, horario: string) => void
  onAdicionarQuarto: (pousadaId: string) => void
  onRemoverQuarto: (pousadaId: string, quartoId: string) => void
  onQuarto: (pousadaId: string, quartoId: string, quarto: string) => void
  onPessoas: (pousadaId: string, quartoId: string, pessoas: number) => void
  onItem: (pousadaId: string, quartoId: string, key: string, qtd: number) => void
  onLimpar: (pousadaId: string) => void
}

function Stepper({ valor, onChange, rotulo }: { valor: number; onChange: (v: number) => void; rotulo: string }) {
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

export function PousadaCard({
  pedido,
  onHorario,
  onAdicionarQuarto,
  onRemoverQuarto,
  onQuarto,
  onPessoas,
  onItem,
  onLimpar,
}: PousadaCardProps) {
  const { pousada, horario, quartos } = pedido
  const ativo = quartos.some((q) => q.quarto.trim() || q.pessoas > 0 || Object.values(q.itens).some((v) => v > 0))

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border p-5 transition-colors",
        ativo ? "border-accent bg-accent shadow-sm" : "border-border bg-card",
      )}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-card-foreground">{pousada.nome}</h2>
        {ativo ? (
          <button
            type="button"
            onClick={() => onLimpar(pousada.id)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden="true" />
            Limpar
          </button>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">Vazio</span>
        )}
      </div>

      {/* Horário: fixo para a maioria das pousadas, mas pode ser ajustado quando necessário */}
      <div className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Clock className="size-3.5" aria-hidden="true" />
          Horário{pousada.horarioFixo ? " (fixo)" : ""}
        </span>
        <select
          value={horario}
          onChange={(e) => onHorario(pousada.id, e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        >
          {HORARIOS_DISPONIVEIS.map((h) => (
            <option key={h} value={h}>
              {h}hrs
            </option>
          ))}
        </select>
      </div>

      {/* Quartos/chalés/suítes da pousada */}
      <div className="flex flex-col gap-3">
        {quartos.map((q, idx) => {
          const totalItens = Object.values(q.itens).reduce((a, b) => a + (b || 0), 0)
          const quartoAtivo = Boolean(q.quarto.trim() || q.pessoas > 0 || totalItens > 0)
          return (
            <div
              key={q.quartoId}
              className={cn(
                "flex flex-col gap-3 rounded-xl border p-3",
                quartoAtivo ? "border-primary/30 bg-background" : "border-dashed border-input bg-background/60",
              )}
            >
              <div className="flex items-center gap-2">
                <DoorOpen className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <input
                  type="text"
                  value={q.quarto}
                  onChange={(e) => onQuarto(pousada.id, q.quartoId, e.target.value)}
                  placeholder={`Chalé / Quarto / Suíte ${idx + 1}`}
                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
                {quartos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoverQuarto(pousada.id, q.quartoId)}
                    aria-label="Remover quarto"
                    className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-2">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Users className="size-4 text-primary" aria-hidden="true" />
                  Pessoas
                </span>
                <Stepper
                  valor={q.pessoas}
                  onChange={(v) => onPessoas(pousada.id, q.quartoId, v)}
                  rotulo={`pessoas ${pousada.nome} ${idx + 1}`}
                />
              </div>

              <fieldset className="flex flex-col gap-1.5">
                <legend className="text-xs font-medium text-muted-foreground">Itens</legend>
                <div className="flex flex-col gap-1.5">
                  {ITENS.map((it) => {
                    const Icone = ICONES[it.key]
                    const qtd = q.itens[it.key] ?? 0
                    return (
                      <div
                        key={it.key}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                          qtd > 0
                            ? "border-primary/40 bg-primary/10 text-foreground"
                            : "border-input bg-background text-foreground",
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
                          onChange={(v) => onItem(pousada.id, q.quartoId, it.key, v)}
                          rotulo={`${it.label} ${pousada.nome} ${idx + 1}`}
                        />
                      </div>
                    )
                  })}
                </div>
              </fieldset>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => onAdicionarQuarto(pousada.id)}
        className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-input py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
      >
        <Plus className="size-4" aria-hidden="true" />
        Adicionar quarto/chalé
      </button>
    </div>
  )
}

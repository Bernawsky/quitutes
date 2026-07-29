"use client"

import { Clock, Users, MessageSquare, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type Chale = {
  id: number
  nome: string
  horario: string
  pessoas: string
  observacoes: string
}

type ChaleCardProps = {
  chale: Chale
  onChange: (id: number, campo: keyof Chale, valor: string) => void
  onLimpar: (id: number) => void
}

export function ChaleCard({ chale, onChange, onLimpar }: ChaleCardProps) {
  const ativo = Boolean(chale.horario || chale.pessoas || chale.observacoes)

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border bg-card p-5 transition-colors",
        ativo ? "border-primary/60 shadow-sm" : "border-border",
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
            {chale.id}
          </span>
          <h2 className="font-heading text-lg font-semibold text-card-foreground">{chale.nome}</h2>
        </div>
        {ativo ? (
          <button
            type="button"
            onClick={() => onLimpar(chale.id)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden="true" />
            Limpar
          </button>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">Vazio</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Clock className="size-3.5" aria-hidden="true" />
            Horário
          </span>
          <input
            type="text"
            inputMode="text"
            placeholder="Ex: 7h"
            value={chale.horario}
            onChange={(e) => onChange(chale.id, "horario", e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Users className="size-3.5" aria-hidden="true" />
            Pessoas
          </span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Ex: 2"
            value={chale.pessoas}
            onChange={(e) => onChange(chale.id, "pessoas", e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <MessageSquare className="size-3.5" aria-hidden="true" />
          Observações
        </span>
        <input
          type="text"
          placeholder="Ex: adiantar o café"
          value={chale.observacoes}
          onChange={(e) => onChange(chale.id, "observacoes", e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </label>

      {ativo && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
          <Check className="size-3.5" aria-hidden="true" />
          Incluído no envio
        </div>
      )}
    </div>
  )
}

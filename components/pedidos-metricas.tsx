"use client"

import { useState } from "react"
import { Search, Clock, ChevronDown, Ban } from "lucide-react"
import { Button } from "@/components/ui/button"
import { normalizarHorario, observacoesUnidade } from "@/lib/pedidos"
import { useDadosMetricas } from "@/hooks/use-dados-metricas"
import { AoEntrar } from "@/components/ao-entrar"
import { cn } from "@/lib/utils"

export function PedidosMetricas() {
  const [busca, setBusca] = useState("")
  const [dataExata, setDataExata] = useState("")
  const [expandido, setExpandido] = useState<number | null>(null)
  const { filtrados, isLoading } = useDadosMetricas({ busca, dataExata })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2.5">
        <div className="flex min-w-48 flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por pousada, quarto/chalé ou saudação..."
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
          />
        </div>
        <input
          type="date"
          value={dataExata}
          onChange={(e) => setDataExata(e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
        />
        {(busca || dataExata) && (
          <Button
            variant="ghost"
            size="sm"
            className="tap"
            onClick={() => {
              setBusca("")
              setDataExata("")
            }}
          >
            Limpar
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando pedidos...</p>
      ) : filtrados.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <p className="font-heading text-base font-semibold text-card-foreground">Nenhum pedido encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground">Ajuste os filtros ou aguarde novos envios.</p>
        </div>
      ) : (
        <AoEntrar>
        <ul className="flex flex-col gap-2 rounded-xl border border-border bg-card p-1.5">
          {filtrados.map((p) => {
            const cancelado = p.status === "cancelado"
            const aberto = expandido === p.id
            return (
              <li key={p.id} className={cn("rounded-lg", cancelado && "bg-destructive/5")}>
                <button
                  type="button"
                  onClick={() => setExpandido(aberto ? null : p.id)}
                  className="tap flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
                >
                  <ChevronDown
                    className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", aberto && "rotate-180")}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-card-foreground">
                      #{p.id} · {p.pousada ?? "—"} — {p.saudacao || p.titulo}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3 shrink-0" aria-hidden="true" />
                      {new Date(p.created_at).toLocaleString("pt-BR")} • {p.total_unidades} cesta(s) • {p.total_pessoas} pessoa(s)
                    </p>
                  </div>
                  {cancelado && (
                    <span className="flex shrink-0 items-center gap-1 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[11px] font-semibold text-destructive">
                      <Ban className="size-3" aria-hidden="true" />
                      Cancelado
                    </span>
                  )}
                </button>

                {aberto && (
                  <div className="px-3 pb-3 pl-9">
                    <ul className="flex flex-col gap-1 border-l border-border pl-3">
                      {(p.unidades ?? []).map((u, i) => {
                        const obs = observacoesUnidade(u).join(", ").replace(/\*/g, "")
                        return (
                          <li key={`${p.id}-${i}`} className="text-xs text-muted-foreground">
                            {normalizarHorario(u.horario)} • {u.unidade} — {u.pessoas} pessoa(s)
                            {obs ? ` (${obs})` : ""}
                          </li>
                        )
                      })}
                    </ul>
                    {cancelado && p.motivo_cancelamento && (
                      <p className="mt-2 text-xs font-medium text-destructive">Motivo: {p.motivo_cancelamento}</p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
        </AoEntrar>
      )}
    </div>
  )
}

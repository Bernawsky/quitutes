"use client"

import useSWR from "swr"
import { Clock, UtensilsCrossed } from "lucide-react"
import { getHistoricoPedidos } from "@/lib/pedidos-api"
import { getPousadas } from "@/lib/pousadas-api"

export function HistoricoMetricas() {
  const { data: historico = [], isLoading } = useSWR("historico-pedidos", getHistoricoPedidos)
  const { data: pousadas = [] } = useSWR("pousadas", getPousadas)
  const mapaPousadas = new Map(pousadas.map((p) => [p.id, p.nome]))

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 font-heading text-sm font-semibold text-card-foreground">Edições e cancelamentos</h2>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando histórico...</p>
      ) : historico.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma edição ou cancelamento registrado ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {historico.map((h) => {
            const buffet = h.dados_novos?.tipo === "buffet"
            return (
            <li key={h.id} className="rounded-lg border border-border p-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-card-foreground">
                {buffet && (
                  <span className="flex items-center gap-1 rounded-md bg-accent/40 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-accent-foreground uppercase">
                    <UtensilsCrossed className="size-3" aria-hidden="true" />
                    Buffet
                  </span>
                )}
                Pedido #{h.pedido_id} · {h.pousada_id ? (mapaPousadas.get(h.pousada_id) ?? "Pousada removida") : "—"} —{" "}
                {h.acao === "cancelado" ? "Cancelado" : "Editado"}
              </p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3.5" aria-hidden="true" />
                {new Date(h.created_at).toLocaleString("pt-BR")}
              </p>
              {h.motivo && <p className="mt-1 text-xs font-medium text-destructive">Motivo: {h.motivo}</p>}
            </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

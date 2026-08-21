"use client"

import { useState } from "react"
import useSWR from "swr"
import { Clock, Pencil, Ban, ShoppingBasket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getMeusPedidos } from "@/lib/pedidos-api"
import { normalizarHorario, observacoesUnidade, type Pedido } from "@/lib/pedidos"
import { EditarPedidoDialog } from "@/components/editar-pedido-dialog"
import { CancelarPedidoDialog } from "@/components/cancelar-pedido-dialog"
import type { Pousada } from "@/lib/pousadas"

export function MeusPedidos({ pousada }: { pousada: Pousada }) {
  const { data: pedidos = [], isLoading, mutate } = useSWR<Pedido[]>(["meus-pedidos", pousada.id], () => getMeusPedidos(pousada.id))
  const [editando, setEditando] = useState<Pedido | null>(null)
  const [cancelando, setCancelando] = useState<Pedido | null>(null)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando seus pedidos...</p>
  }

  if (pedidos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <ShoppingBasket className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
        <p className="font-heading text-lg font-semibold text-card-foreground">Nenhum pedido enviado ainda</p>
        <p className="mt-1 text-sm text-muted-foreground">Os pedidos que você enviar aparecerão aqui.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {pedidos.map((p) => {
        const cancelado = p.status === "cancelado"
        return (
          <div key={p.id} className={"rounded-2xl border p-4 " + (cancelado ? "border-destructive/40 bg-destructive/5" : "border-border bg-card")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-card-foreground">
                  #{p.id} — {p.saudacao || p.titulo}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" aria-hidden="true" />
                  {new Date(p.created_at).toLocaleString("pt-BR")} • {p.total_unidades} cesta(s) • {p.total_pessoas} pessoa(s)
                  {cancelado ? " • Cancelado" : ""}
                </p>
              </div>
              {!cancelado && (
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2" onClick={() => setEditando(p)}>
                    <Pencil className="size-4" aria-hidden="true" />
                    Editar
                  </Button>
                  <Button variant="destructive" className="gap-2" onClick={() => setCancelando(p)}>
                    <Ban className="size-4" aria-hidden="true" />
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
            <ul className="mt-3 flex flex-col gap-1">
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
            {cancelado && p.motivo_cancelamento && <p className="mt-2 text-xs font-medium text-destructive">Motivo: {p.motivo_cancelamento}</p>}
          </div>
        )
      })}

      {editando && (
        <EditarPedidoDialog pedido={editando} pousada={pousada} onClose={() => setEditando(null)} onSalvo={() => void mutate()} />
      )}
      {cancelando && (
        <CancelarPedidoDialog pedido={cancelando} onClose={() => setCancelando(null)} onCancelado={() => void mutate()} />
      )}
    </div>
  )
}

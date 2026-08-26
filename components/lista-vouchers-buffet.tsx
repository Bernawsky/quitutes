"use client"

import useSWR from "swr"
import { UtensilsCrossed, Users, CalendarDays, Ban } from "lucide-react"
import { getPedidosBuffet } from "@/lib/pedidos-api"
import { rotuloData } from "@/lib/pedidos"
import { cn } from "@/lib/utils"

/** Lista de vouchers de Buffet — usada tanto na aba admin quanto na tela da equipe da cafeteria. */
export function ListaVouchersBuffet() {
  const { data: vouchers = [], isLoading } = useSWR("buffet-vouchers", () => getPedidosBuffet())

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  if (vouchers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <UtensilsCrossed className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
        <p className="font-heading text-base font-semibold text-card-foreground">Nenhum voucher ainda</p>
        <p className="mt-1 text-sm text-muted-foreground">Vouchers enviados pelas pousadas aparecem aqui.</p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-2 rounded-xl border border-border bg-card p-1.5">
      {vouchers.map((v) => {
        const cancelado = v.status === "cancelado"
        return (
          <li
            key={v.id}
            className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3 py-2.5", cancelado && "bg-destructive/5")}
          >
            <span className="flex items-center gap-1 rounded-md bg-accent/40 px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-accent-foreground uppercase">
              Buffet
            </span>
            <span className="text-sm font-medium text-card-foreground">{v.pousada ?? "—"}</span>
            <span className="text-sm text-muted-foreground">{v.saudacao || v.titulo}</span>
            <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              {rotuloData(v.data_pedido)}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="size-3.5" aria-hidden="true" />
              {v.total_pessoas}
            </span>
            {cancelado && (
              <span className="flex items-center gap-1 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[11px] font-semibold text-destructive">
                <Ban className="size-3" aria-hidden="true" />
                Cancelado
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

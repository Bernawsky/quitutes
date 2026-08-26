"use client"

import { useEffect, useState, useTransition } from "react"
import useSWR from "swr"
import { UtensilsCrossed, Users, CalendarDays, Ban } from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { getPedidosBuffet } from "@/lib/pedidos-api"
import { getBuffetAtivo, definirBuffetAtivo } from "@/app/actions/buffet"
import { rotuloData } from "@/lib/pedidos"
import { cn } from "@/lib/utils"

export function BuffetAdmin() {
  const [ativo, setAtivo] = useState<boolean | null>(null)
  const [pending, startTransition] = useTransition()
  const { data: vouchers = [], isLoading } = useSWR("buffet-vouchers", () => getPedidosBuffet())

  useEffect(() => {
    void getBuffetAtivo().then(setAtivo)
  }, [])

  const alternar = (novoValor: boolean) => {
    setAtivo(novoValor)
    startTransition(async () => {
      try {
        await definirBuffetAtivo(novoValor)
        toast.success(novoValor ? "Buffet ativado" : "Buffet desativado", {
          description: novoValor
            ? "As pousadas já podem enviar vouchers de Buffet."
            : "As pousadas não conseguem mais enviar novos vouchers.",
        })
      } catch (e) {
        setAtivo(!novoValor)
        toast.error("Não foi possível salvar", { description: e instanceof Error ? e.message : undefined })
      }
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <UtensilsCrossed className="size-5" aria-hidden="true" />
        </span>
        <div className="mr-auto">
          <p className="font-heading text-base font-semibold text-card-foreground">Buffet de café colonial</p>
          <p className="text-sm text-muted-foreground">
            {ativo === null ? "Carregando..." : ativo ? "Recebendo vouchers das pousadas" : "Desativado — pousadas não conseguem enviar vouchers"}
          </p>
        </div>
        <Switch checked={ativo ?? false} onCheckedChange={alternar} disabled={ativo === null || pending} />
      </section>

      <section>
        <h2 className="mb-3 font-heading text-base font-semibold text-foreground">Vouchers enviados</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : vouchers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <UtensilsCrossed className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
            <p className="font-heading text-base font-semibold text-card-foreground">Nenhum voucher ainda</p>
            <p className="mt-1 text-sm text-muted-foreground">Vouchers enviados pelas pousadas aparecem aqui.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2 rounded-xl border border-border bg-card p-1.5">
            {vouchers.map((v) => {
              const cancelado = v.status === "cancelado"
              return (
                <li
                  key={v.id}
                  className={cn(
                    "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3 py-2.5",
                    cancelado && "bg-destructive/5",
                  )}
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
        )}
      </section>
    </div>
  )
}

"use client"

import { useEffect, useState, useTransition } from "react"
import { UtensilsCrossed } from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { ListaVouchersBuffet } from "@/components/lista-vouchers-buffet"
import { getBuffetAtivo, definirBuffetAtivo } from "@/app/actions/buffet"

export function BuffetAdmin() {
  const [ativo, setAtivo] = useState<boolean | null>(null)
  const [pending, startTransition] = useTransition()

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
        <ListaVouchersBuffet />
      </section>
    </div>
  )
}

import type { Metadata } from "next"
import { UtensilsCrossed } from "lucide-react"
import { exigirEquipeServer } from "@/lib/supabase/server"
import { ListaVouchersBuffet } from "@/components/lista-vouchers-buffet"
import { AvisosBell } from "@/components/avisos-bell"
import { AvisoPushDesativado } from "@/components/aviso-push-desativado"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Vouchers do Buffet — Cafeteria",
  description: "Quem vem tomar café na cafeteria, enviado pelas pousadas.",
}

export default async function VouchersPage() {
  await exigirEquipeServer()

  return (
    <div className="min-h-svh bg-background pb-16">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-5">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <UtensilsCrossed className="size-5" aria-hidden="true" />
          </span>
          <div className="mr-auto">
            <h1 className="font-heading text-xl font-bold text-card-foreground">Vouchers do Buffet</h1>
            <p className="text-sm text-muted-foreground">Hóspedes que as pousadas enviaram para o café da cafeteria</p>
          </div>
          <AvisosBell />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <AvisoPushDesativado />
        <ListaVouchersBuffet />
      </main>
    </div>
  )
}

import type { Metadata } from "next"
import Link from "next/link"
import { UtensilsCrossed, Settings } from "lucide-react"
import { exigirEquipeServer } from "@/lib/supabase/server"
import { ListaVouchersBuffet } from "@/components/lista-vouchers-buffet"
import { AvisosBell } from "@/components/avisos-bell"
import { AvisoPushDesativado } from "@/components/aviso-push-desativado"
import { BotaoSair } from "@/components/botao-sair"

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
          <Link
            href="/configuracoes"
            className="tap inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Settings className="size-4" aria-hidden="true" />
            Configurações
          </Link>
          <BotaoSair />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <AvisoPushDesativado />
        <ListaVouchersBuffet />
      </main>
    </div>
  )
}

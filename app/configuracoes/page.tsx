import type { Metadata } from "next"
import { Settings } from "lucide-react"
import { exigirSessaoServer } from "@/lib/supabase/server"
import { ConfiguracoesNotificacoes } from "@/components/configuracoes-notificacoes"
import { BotaoSair } from "@/components/botao-sair"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Configurações — Quitutes",
  description: "Tema, tamanho da fonte e notificações da sua conta.",
}

export default async function ConfiguracoesPage() {
  await exigirSessaoServer()

  return (
    <div className="min-h-svh bg-background pb-16">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-5">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Settings className="size-5" aria-hidden="true" />
          </span>
          <div className="mr-auto">
            <h1 className="font-heading text-xl font-bold text-card-foreground">Configurações</h1>
            <p className="text-sm text-muted-foreground">Tema, fonte e notificações da sua conta</p>
          </div>
          <BotaoSair />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <ConfiguracoesNotificacoes />
      </main>
    </div>
  )
}

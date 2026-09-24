"use client"

import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { encerrarSessao } from "@/lib/supabase/client"

/**
 * Botão de sair reutilizado nas telas de equipe sem shell próprio (cozinha, cafeteria,
 * entregador) — essas contas não tinham nenhuma forma de encerrar a sessão manualmente.
 */
export function BotaoSair({ className }: { className?: string }) {
  const router = useRouter()

  const sair = async () => {
    await encerrarSessao()
    router.replace("/")
  }

  return (
    <Button variant="ghost" onClick={() => void sair()} className={className ?? "tap gap-2"}>
      <LogOut className="size-4" aria-hidden="true" />
      Sair
    </Button>
  )
}

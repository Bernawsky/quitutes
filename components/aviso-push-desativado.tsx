"use client"

import { useEffect, useState } from "react"
import { BellOff, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePushNotifications } from "@/hooks/use-push-notifications"

const CHAVE_DISPENSADO = "quitutes-aviso-push-dispensado"

/** Avisa uma única vez por pessoa que as notificações push estão desligadas — some para sempre depois de fechado ou ativado. */
export function AvisoPushDesativado() {
  const { estado, carregando, ativar, iosNaoInstalado } = usePushNotifications()
  const [fechado, setFechado] = useState(true)

  useEffect(() => {
    setFechado(localStorage.getItem(CHAVE_DISPENSADO) === "1")
  }, [])

  const dispensar = () => {
    localStorage.setItem(CHAVE_DISPENSADO, "1")
    setFechado(true)
  }

  if (estado === "ativo" || fechado) return null

  const mensagem =
    iosNaoInstalado && estado === "indisponivel"
      ? 'No iPhone/iPad, toque em Compartilhar → "Adicionar à Tela de Início" e abra o app por lá para poder ativar as notificações.'
      : estado === "negado"
        ? "Notificações bloqueadas neste navegador. Permita nas configurações do site para receber avisos de novos pedidos."
        : estado === "indisponivel"
          ? "Notificações push não estão disponíveis neste navegador."
          : "Notificações desativadas — você só vai saber de novos pedidos entrando no sistema."

  return (
    <div className="mb-5 flex items-start gap-2 rounded-2xl border border-primary/30 bg-primary/5 p-3.5 text-sm text-foreground">
      <BellOff className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <p className="flex-1">{mensagem}</p>
      {estado === "inativo" && (
        <Button size="sm" className="tap h-7 shrink-0 gap-1.5 px-2.5 text-xs" disabled={carregando} onClick={() => void ativar()}>
          Ativar
        </Button>
      )}
      <button
        type="button"
        onClick={dispensar}
        aria-label="Fechar aviso"
        className="tap flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

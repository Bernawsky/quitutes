"use client"

import { useState } from "react"
import useSWR from "swr"
import { BellRing, Truck, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { getPreferenciasNotificacao, salvarPreferenciasNotificacao } from "@/lib/notificacoes-api"

const ROTULO_PERMISSAO: Record<string, string> = {
  granted: "Permitido",
  denied: "Bloqueado pelo navegador",
  default: "Ainda não pedido",
  indisponivel: "Não suportado neste navegador",
}

/**
 * Mostra o estado real das notificações (permissão do navegador + inscrição ativa, sem depender
 * de suposição) e as preferências da conta — hoje só o aviso de entrega, ligado por padrão.
 * Usado tanto pelo admin (/metricas/configuracoes) quanto pela pousada (aba dentro do portal).
 */
export function ConfiguracoesNotificacoes() {
  const { user } = useAuth()
  const { estado, permissao, carregando, ativar, desativar, iosNaoInstalado } = usePushNotifications()
  const { data: preferencias, mutate } = useSWR(
    user ? ["preferencias-notificacao", user.id] : null,
    () => getPreferenciasNotificacao(user!.id),
  )
  const [salvando, setSalvando] = useState(false)

  async function alternarEntregas(valor: boolean) {
    if (!user) return
    setSalvando(true)
    try {
      await salvarPreferenciasNotificacao(user.id, { entregas_ativas: valor })
      await mutate({ entregas_ativas: valor })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BellRing className="size-4" aria-hidden="true" />
          </span>
          <h2 className="font-heading text-base font-semibold text-card-foreground">Notificações push</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Avisos de novo pedido, edição, cancelamento e entrega direto no navegador ou celular.
        </p>

        <div className="mt-4 flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
            <span className="text-muted-foreground">Permissão do navegador</span>
            <span className="font-medium text-foreground">{ROTULO_PERMISSAO[permissao] ?? permissao}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
            <span className="text-muted-foreground">Inscrição ativa neste dispositivo</span>
            <span className={cn("font-medium", estado === "ativo" ? "text-emerald-600" : "text-foreground")}>
              {estado === "ativo" ? "Sim" : estado === "indisponivel" ? "Indisponível" : "Não"}
            </span>
          </div>
        </div>

        {iosNaoInstalado && (
          <p className="mt-3 flex items-start gap-1.5 text-xs text-amber-700">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            No iPhone/iPad, primeiro adicione o site à Tela de Início (Compartilhar → Adicionar à Tela de Início) — sem isso o iOS não entrega notificações.
          </p>
        )}

        {estado === "negado" && (
          <p className="mt-3 text-xs text-muted-foreground">
            As notificações foram bloqueadas nas configurações do navegador — pra reativar, mude a permissão do site manualmente e recarregue a página.
          </p>
        )}

        {estado !== "indisponivel" && (
          <Button
            variant={estado === "ativo" ? "outline" : "default"}
            className="tap mt-4 gap-2"
            disabled={carregando || estado === "negado"}
            onClick={() => void (estado === "ativo" ? desativar() : ativar())}
          >
            {carregando ? "Aguarde..." : estado === "ativo" ? "Desativar notificações" : "Ativar notificações"}
          </Button>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Truck className="size-4" aria-hidden="true" />
          </span>
          <h2 className="font-heading text-base font-semibold text-card-foreground">Avisos de entrega</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Quando o entregador marcar um pedido como entregue, avisar por notificação. Vem ligado por padrão.
        </p>
        <label className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2.5">
          <span className="text-sm font-medium text-foreground">Notificar entregas</span>
          <Switch checked={preferencias?.entregas_ativas ?? true} disabled={salvando || !user} onCheckedChange={alternarEntregas} />
        </label>
      </section>
    </div>
  )
}
